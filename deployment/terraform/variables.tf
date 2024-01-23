variable "tenancy_ocid" {
  type = string
}

variable "region" {
  type    = string
  default = "us-chicago-1"
}

variable "compartment_ocid" {
  type = string
}

variable "cert_fullchain" {
  type = string
}

variable "cert_private_key" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "project_name" {
  type = string
  default = "genai"
}

variable "instance_shape" {
  default = "VM.Standard.E4.Flex"
}

variable "web_node_count" {
  default = "1"
}

variable "backend_node_count" {
  default = "1"
}

variable "artifacts_par_expiration_in_days" {
  type = number
  default = 7
}