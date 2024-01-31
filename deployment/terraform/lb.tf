variable "lb_shape_max_bandwidth" {
  default = 40
}

variable "lb_shape_min_bandwidth" {
  default = 10
}

resource "oci_core_public_ip" "reserved_ip" {
  compartment_id = var.compartment_ocid
  lifetime       = "RESERVED"

  lifecycle {
    ignore_changes = [private_ip_id]
  }
}

resource "oci_load_balancer" "lb" {
  shape          = "flexible"
  compartment_id = var.compartment_ocid

  subnet_ids = [
    oci_core_subnet.publicsubnet.id,
  ]

  shape_details {
    maximum_bandwidth_in_mbps = var.lb_shape_max_bandwidth
    minimum_bandwidth_in_mbps = var.lb_shape_min_bandwidth
  }

  display_name = "${var.project_name} ${random_string.deploy_id.result}"
  reserved_ips {
    id = oci_core_public_ip.reserved_ip.id
  }
}

resource "oci_load_balancer_backend_set" "frontend_backendset" {
  name             = "frontend_backendset"
  load_balancer_id = oci_load_balancer.lb.id
  policy           = "ROUND_ROBIN"

  health_checker {
    port                = "80"
    protocol            = "HTTP"
    response_body_regex = ".*"
    url_path            = "/"
  }
}

resource "oci_load_balancer_backend" "frontend_backend" {
  count            = var.web_node_count
  backendset_name  = oci_load_balancer_backend_set.frontend_backendset.name
  ip_address       = oci_core_instance.web[count.index].private_ip
  load_balancer_id = oci_load_balancer.lb.id
  port             = 80
}

resource "oci_load_balancer_backend_set" "backend_backendset" {
  name             = "backend_backendset"
  load_balancer_id = oci_load_balancer.lb.id
  policy           = "ROUND_ROBIN"

  health_checker {
    port                = "8080"
    protocol            = "TCP"
    response_body_regex = ".*"
    url_path            = "/"
  }
}

resource "oci_load_balancer_backend" "backend_backend" {
  count            = var.backend_node_count
  backendset_name  = oci_load_balancer_backend_set.backend_backendset.name
  ip_address       = oci_core_instance.backend[count.index].private_ip
  load_balancer_id = oci_load_balancer.lb.id
  port             = 8080
}

resource "oci_load_balancer_load_balancer_routing_policy" "routing_policy" {
  condition_language_version = "V1"
  load_balancer_id           = oci_load_balancer.lb.id
  name                       = "routing_policy"

  rules {
    name      = "routing_to_backend"
    condition = "any(http.request.url.path sw (i '/websocket'))"
    actions {
      name             = "FORWARD_TO_BACKENDSET"
      backend_set_name = oci_load_balancer_backend_set.backend_backendset.name
    }
  }

  rules {
    name      = "routing_to_frontend"
    condition = "any(http.request.url.path eq (i '/'))"
    actions {
      name             = "FORWARD_TO_BACKENDSET"
      backend_set_name = oci_load_balancer_backend_set.frontend_backendset.name
    }
  }
}

resource "oci_load_balancer_rule_set" "rule_set_to_ssl" {
  name             = "rule_set_to_ssl"
  load_balancer_id = oci_load_balancer.lb.id
  items {
    description = "Redirection to SSL"
    action      = "REDIRECT"

    conditions {
      attribute_name  = "PATH"
      attribute_value = "/"

      operator = "FORCE_LONGEST_PREFIX_MATCH"
    }

    redirect_uri {
      port     = 443
      protocol = "HTTPS"
    }
    response_code = 302
  }
}

resource "oci_load_balancer_listener" "listener_ssl" {
  load_balancer_id         = oci_load_balancer.lb.id
  name                     = "https"
  routing_policy_name      = oci_load_balancer_load_balancer_routing_policy.routing_policy.name
  default_backend_set_name = oci_load_balancer_backend_set.frontend_backendset.name
  port                     = 443
  protocol                 = "HTTP"

  connection_configuration {
    idle_timeout_in_seconds = "30"
  }

  ssl_configuration {
    certificate_name        = oci_load_balancer_certificate.certificate.certificate_name
    verify_peer_certificate = false
    protocols               = ["TLSv1.1", "TLSv1.2"]
    server_order_preference = "ENABLED"
    cipher_suite_name       = oci_load_balancer_ssl_cipher_suite.ssl_cipher_suite.name
  }
}
resource "oci_load_balancer_listener" "listener_nossl" {
  load_balancer_id         = oci_load_balancer.lb.id
  name                     = "http"
  routing_policy_name      = oci_load_balancer_load_balancer_routing_policy.routing_policy.name
  default_backend_set_name = oci_load_balancer_backend_set.frontend_backendset.name
  rule_set_names           = [oci_load_balancer_rule_set.rule_set_to_ssl.name]
  port                     = 80
  protocol                 = "HTTP"

  connection_configuration {
    idle_timeout_in_seconds = "30"
  }

}

resource "oci_load_balancer_certificate" "certificate" {
  certificate_name = "genai.victormartin.dev"
  load_balancer_id = oci_load_balancer.lb.id

  ca_certificate     = file(var.cert_fullchain)
  private_key        = file(var.cert_private_key)
  public_certificate = file(var.cert_fullchain)

}

resource "oci_load_balancer_ssl_cipher_suite" "ssl_cipher_suite" {
  name             = "ssl_cipher_suite"
  ciphers          = ["AES128-SHA", "AES256-SHA"]
  load_balancer_id = oci_load_balancer.lb.id
}
