output "deploy_id" {
  value = random_string.deploy_id.result
}

output "load_balancer" {
  value = oci_core_public_ip.reserved_ip.ip_address
}

output "web_instances" {
  value = oci_core_instance.web[*].private_ip
}

output "backend_instances" {
  value = oci_core_instance.backend[*].private_ip
}