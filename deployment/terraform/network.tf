resource "oci_core_virtual_network" "vcn" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "${var.project_name} ${random_string.deploy_id.result}"
  dns_label      = "${var.project_name}${random_string.deploy_id.result}"
}

resource "oci_core_internet_gateway" "internet_gateway" {
  compartment_id = var.compartment_ocid
  display_name   = "ig_${var.project_name}_${random_string.deploy_id.result}"
  vcn_id         = oci_core_virtual_network.vcn.id
}

resource "oci_core_default_route_table" "default_route_table" {
  manage_default_resource_id = oci_core_virtual_network.vcn.default_route_table_id
  display_name               = "DefaultRouteTable"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.internet_gateway.id
  }
}

resource "oci_core_subnet" "publicsubnet" {
  cidr_block        = "10.0.1.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_virtual_network.vcn.id
  display_name      = "public_subnet_${var.project_name}_${random_string.deploy_id.result}"
  dns_label         = "public"
  security_list_ids = [oci_core_virtual_network.vcn.default_security_list_id, oci_core_security_list.http_security_list.id]
  route_table_id    = oci_core_virtual_network.vcn.default_route_table_id
  dhcp_options_id   = oci_core_virtual_network.vcn.default_dhcp_options_id
}

resource "oci_core_subnet" "privatesubnet" {
  cidr_block        = "10.0.2.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_virtual_network.vcn.id
  display_name      = "private_subnet_${var.project_name}_${random_string.deploy_id.result}"
  dns_label         = "private"
  prohibit_public_ip_on_vnic = true
  prohibit_internet_ingress = true
  security_list_ids = [oci_core_virtual_network.vcn.default_security_list_id, oci_core_security_list.private_security_list.id]
  route_table_id    = oci_core_virtual_network.vcn.default_route_table_id
  dhcp_options_id   = oci_core_virtual_network.vcn.default_dhcp_options_id
}

resource "oci_core_security_list" "http_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.vcn.id
  display_name   = "HTTP Security List"

  ingress_security_rules {
    protocol  = "6" // tcp
    source    = "0.0.0.0/0"
    stateless = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol  = "6" // tcp
    source    = "0.0.0.0/0"
    stateless = false

    tcp_options {
      min = 443
      max = 443
    }
  }

}

resource "oci_core_security_list" "private_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.vcn.id
  display_name   = "Private Security List"

  ingress_security_rules {
    protocol  = "6" // tcp
    source    = oci_core_subnet.publicsubnet.cidr_block
    stateless = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol  = "6" // tcp
    source    = oci_core_subnet.publicsubnet.cidr_block
    stateless = false

    tcp_options {
      min = 8080
      max = 8080
    }
  }
}