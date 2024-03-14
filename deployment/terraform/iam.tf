// allow dynamic-group <resource_dynamic_group_in_tenancy> to manage generative-ai-family in <compartment_name>

locals {
  dynamic_group_name = "${local.project_name}_${local.deploy_id}_compartment_dynamic_group"
}

resource "oci_identity_dynamic_group" "genai_dynamic_group" {
  provider       = oci.home_region
  name           = local.dynamic_group_name
  compartment_id = var.tenancy_ocid
  description    = "${local.project_name} ${local.deploy_id} Dynamic Group"
  matching_rule  = "ALL { resource.type = 'instance-family', resource.compartment.id = '${var.compartment_ocid}'}"
}

resource "oci_identity_policy" "allow-genai-policy" {
  provider       = oci.home_region
  compartment_id = var.tenancy_ocid
  name           = local.dynamic_group_name
  description    = "Allow dynamic group to manage gen ai service for ${local.project_name} ${local.deploy_id}"
  statements = [
    "allow dynamic-group ${local.dynamic_group_name} to manage generative-ai-family in compartment id ${var.compartment_ocid}"
  ]
}