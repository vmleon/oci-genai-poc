resource "oci_objectstorage_bucket" "artifacts_bucket" {
  compartment_id = var.compartment_ocid
  name           = "artifacts_${var.project_name}_${random_string.deploy_id.result}"
  namespace      = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
}

resource "oci_objectstorage_object" "backend_jar_object" {
  bucket    = oci_objectstorage_bucket.artifacts_bucket.name
  content   = filebase64("${path.module}/generated/backend_jar.tar.gz")
  namespace = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  object    = "backend_jar.tar.gz" # FIXME include versioning

}

resource "oci_objectstorage_preauthrequest" "backend_jar_par" {
  access_type  = "ObjectRead"
  bucket       = oci_objectstorage_bucket.artifacts_bucket.name
  name         = "backend_jar_par"
  namespace    = data.oci_objectstorage_namespace.objectstorage_namespace.namespace
  time_expires = timeadd(timestamp(), "${var.artifacts_par_expiration_in_days * 24}h")

  object_name = oci_objectstorage_object.backend_jar_object.object
}