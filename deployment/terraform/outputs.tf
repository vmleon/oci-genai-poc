locals {
  model_collection = data.oci_generative_ai_models.genai_models.model_collection[0]
  cohere_models = tolist([for each in local.model_collection.items : each 
    if contains(each.capabilities, "TEXT_GENERATION") 
      && each.vendor == "cohere" ])
}

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

output "cohere_model_id" {
  value = local.cohere_models[0].id
}

output "ssh_bastion_session_backend" {
  value = oci_bastion_session.backend_session.ssh_metadata.command
}

output "ssh_bastion_session_web" {
  value = oci_bastion_session.web_session.ssh_metadata.command
}
