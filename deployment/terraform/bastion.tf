
resource "time_sleep" "wait_for_web_bastion_plugin" {
  depends_on = [data.oci_computeinstanceagent_instance_agent_plugin.web_instance_agent_plugin]
  create_duration = "1m"
}

resource "time_sleep" "wait_for_backend_bastion_plugin" {
  depends_on = [data.oci_computeinstanceagent_instance_agent_plugin.backend_instance_agent_plugin]
  create_duration = "1m"
}

resource "oci_bastion_bastion" "private_subnet_bastion" {
    bastion_type = "standard"
    compartment_id = var.compartment_ocid
    target_subnet_id = oci_core_subnet.privatesubnet.id

    client_cidr_block_allow_list = [local.anywhere]
    name = "bastion_${local.project_name}_${local.deploy_id}"
}

resource "oci_bastion_session" "backend_session" {
    bastion_id = oci_bastion_bastion.private_subnet_bastion.id
    key_details {
        public_key_content = var.ssh_public_key
    }

    target_resource_details {
        session_type = "MANAGED_SSH"

        target_resource_id = oci_core_instance.backend[0].id
        target_resource_operating_system_user_name = "opc"
        target_resource_private_ip_address = oci_core_instance.backend[0].private_ip
    }

    display_name = "session_backend_${local.project_name}_${local.deploy_id}"

    depends_on = [time_sleep.wait_for_backend_bastion_plugin]
}

resource "oci_bastion_session" "web_session" {
    bastion_id = oci_bastion_bastion.private_subnet_bastion.id
    key_details {
        public_key_content = var.ssh_public_key
    }

    target_resource_details {
        session_type = "MANAGED_SSH"

        target_resource_id = oci_core_instance.web[0].id
        target_resource_operating_system_user_name = "opc"
        target_resource_private_ip_address = oci_core_instance.web[0].private_ip
    }

    display_name = "session_web_${local.project_name}_${local.deploy_id}"

    depends_on = [time_sleep.wait_for_web_bastion_plugin]
}
