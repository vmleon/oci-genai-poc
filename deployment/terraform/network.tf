# TODO: CIDR blocks
locals {
#   bastion_subnet_prefix = cidrsubnet(var.vcn_cidr, var.subnet_cidr_offset, 0)
#   private_subnet_prefix = cidrsubnet(var.vcn_cidr, var.subnet_cidr_offset, 1)
  tcp_protocol  = "6"
}

# TODO: Bastion subnet example
# https://github.com/oracle/terraform-provider-oci/blob/master/examples/networking/nat_gateway/nat_gateway.tf

resource "oci_core_virtual_network" "vcn" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "${local.project_name} ${local.deploy_id}"
  dns_label      = "${local.project_name}${local.deploy_id}"
}

resource "oci_core_internet_gateway" "internet_gateway" {
  compartment_id = var.compartment_ocid
  display_name   = "ig_${local.project_name}_${local.deploy_id}"
  vcn_id         = oci_core_virtual_network.vcn.id
}

resource "oci_core_nat_gateway" "nat_gateway" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.vcn.id
  display_name   = "nat_${local.project_name}_${local.deploy_id}"
}

resource "oci_core_default_route_table" "default_route_table" {
  manage_default_resource_id = oci_core_virtual_network.vcn.default_route_table_id
  display_name               = "DefaultRouteTable"

  route_rules {
    destination       = local.anywhere
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.internet_gateway.id
  }
}

resource "oci_core_route_table" "route_private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.vcn.id
  display_name   = "route_private"

  route_rules {
    destination       = local.anywhere
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.nat_gateway.id
  }
}

resource "oci_core_subnet" "publicsubnet" {
  cidr_block        = "10.0.1.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_virtual_network.vcn.id
  display_name      = "public_subnet_${local.project_name}_${local.deploy_id}"
  dns_label         = "public"
  security_list_ids = [oci_core_virtual_network.vcn.default_security_list_id, oci_core_security_list.http_security_list.id]
  route_table_id    = oci_core_virtual_network.vcn.default_route_table_id
  dhcp_options_id   = oci_core_virtual_network.vcn.default_dhcp_options_id
}

resource "oci_core_subnet" "privatesubnet" {
  cidr_block        = "10.0.2.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_virtual_network.vcn.id
  display_name      = "private_subnet_${local.project_name}_${local.deploy_id}"
  dns_label         = "private"
  prohibit_public_ip_on_vnic = true
  security_list_ids = [oci_core_virtual_network.vcn.default_security_list_id, oci_core_security_list.private_security_list.id]
  route_table_id    = oci_core_route_table.route_private.id
  dhcp_options_id   = oci_core_virtual_network.vcn.default_dhcp_options_id
}

resource "oci_core_security_list" "http_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.vcn.id
  display_name   = "HTTP Security List"

  ingress_security_rules {
    protocol  = local.tcp_protocol
    source    = local.anywhere
    stateless = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol  = local.tcp_protocol
    source    = local.anywhere
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
    protocol  = local.tcp_protocol
    source    = oci_core_subnet.publicsubnet.cidr_block
    stateless = false

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol  = local.tcp_protocol
    source    = oci_core_subnet.publicsubnet.cidr_block
    stateless = false

    tcp_options {
      min = 8080
      max = 8080
    }
  }
}