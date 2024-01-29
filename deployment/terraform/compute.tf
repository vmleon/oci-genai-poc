locals {
  web_cloud_init_content = templatefile("${path.module}/userdata/web_bootstrap.tftpl", {
    web_par_full_path = var.web_artifact_url
    ansible_web_par_full_path = var.ansible_web_artifact_url
  })
  backend_cloud_init_content = templatefile("${path.module}/userdata/backend_bootstrap.tftpl", {
    backend_jar_par_full_path = var.backend_artifact_url
    ansible_backend_par_full_path = var.ansible_backend_artifact_url
  })
}

data "oci_core_images" "ol8_images" {
  compartment_id           = var.compartment_ocid
  shape                    = var.instance_shape
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "web" {
  count               = var.web_node_count
  availability_domain = lookup(data.oci_identity_availability_domains.ads.availability_domains[count.index % 3], "name")
  compartment_id      = var.compartment_ocid
  display_name        = "web_${count.index}_${var.project_name}_${random_string.deploy_id.result}"
  shape               = var.instance_shape

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(local.web_cloud_init_content)
  }

  shape_config {
    ocpus         = 1
    memory_in_gbs = 8
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.privatesubnet.id
    assign_public_ip          = false
    display_name              = "web${count.index}"
    hostname_label            = "web${count.index}"
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ol8_images.images[0].id
  }

  timeouts {
    create = "60m"
  }
}

resource "oci_core_instance" "backend" {
  count               = var.backend_node_count
  availability_domain = lookup(data.oci_identity_availability_domains.ads.availability_domains[count.index % 3], "name")
  compartment_id      = var.compartment_ocid
  display_name        = "backend_${count.index}_${var.project_name}_${random_string.deploy_id.result}"
  shape               = var.instance_shape

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(local.backend_cloud_init_content)
  }

  shape_config {
    ocpus         = 1
    memory_in_gbs = 8
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.privatesubnet.id
    assign_public_ip          = false
    display_name              = "backend${count.index}"
    assign_private_dns_record = true
    hostname_label            = "backend${count.index}"
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ol8_images.images[0].id
  }

  timeouts {
    create = "60m"
  }
}
