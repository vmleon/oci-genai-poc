# OCI Gen AI POC

## Build artifacts

### Build Java Application:

```bash
cd backend
```

```bash
./gradlew bootJar
```

> `build/libs/backend-0.0.1.jar` jar file generated

```bash
cd ..
```

### Build Web Application:

```bash
cd web
```

```bash
npm run build
```

> `dist` folder generated

```bash
cd ..
```

## Set Up environment

```bash
cd scripts/ && npm install && cd ..
```

### Set the environment variables

```bash
zx scripts/setenv.mjs
```

> Answer the Compartment name where you want to deploy the infrastructure. Root compartment is the default.

### Collect and deliver the artifacts

```bash
zx scripts/artifacts.mjs
```

### Build TF Vars file

```bash
zx scripts/tfvars.mjs
```

## Deploy

```bash
cd deployment/terraform
```

Init Terraform providers:

```bash
terraform init
```

Plan the deployment:

```bash
terraform plan
```

Apply deployment:

```bash
terraform apply --auto-approve
```

```bash
cd ../..
```

## Issues

There is an issue in Terraform `oracle/oci` provider on version `v5.25.0`. It is not updated to the specific version of `terraform-plugin-sdk` that fix the underlying gRCP limit of 4Mb.

The project would want to upload artifacts to Object Storage, like the backend jar file, which is bigger than 4Mb.

```terraform
data "local_file" "backend_jar_tgz" {
  filename = "${path.module}/../../.artifacts/backend_jar.tar.gz"
}
```

As a workaround, a `script/deliver.mjs` script and a `script/clean.mjs` script will deliver and clean the artifacts into Object Storage and make Pre-Authenticated Requests available for Terraform resources.
