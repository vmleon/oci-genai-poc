# OCI Gen AI POC

![Architecture](./images/architecture.png)

Get troubleshoot help on the [FAQ](FAQ.md)

## Local deployment

Run locally with these steps [Local](LOCAL.md)

## Set Up environment

```bash
cd scripts/ && npm install && cd ..
```

### Set the environment variables

Generate `terraform.tfvars` file for Terraform.

```bash
npx zx scripts/setenv.mjs
```

> Answer the Compartment name where you want to deploy the infrastructure. Root compartment is the default.

### Deploy Infrastructure

```bash
npx zx scripts/tfvars.mjs
```

```bash
cd deploy/terraform
```

Init Terraform providers:

```bash
terraform init
```

Apply deployment:

```bash
terraform apply --auto-approve
```

```bash
cd ../..
```

## Release and create Kustomization files

Build and push images:

```bash
npx zx scripts/release.mjs
```

Create Kustomization files

```bash
npx zx scripts/kustom.mjs
```

### Kubernetes Deployment

```bash
export KUBECONFIG="deploy/terraform/generated/kubeconfig"
```

```bash
kubectl cluster-info
```

```bash
kubectl apply -k deploy/k8s/overlays/prod
```

```bash
kubectl get pod
```

Access your application:

```bash
kubectl get service \
  -n ingress-nginx \
  -o jsonpath='{.items[?(@.spec.type=="LoadBalancer")].status.loadBalancer.ingress[0].ip}'
```

Take the Public IP to your browser.

## Clean up

Delete Kubernetes components

```bash
kubectl delete -k deploy/k8s/overlays/prod
```

Destroy infrastructure with Terraform.

```bash
cd deploy/terraform
```

```bash
terraform destroy -auto-approve
```

```bash
cd ../..
```

Clean up the artifacts on Object Storage

```bash
npx zx scripts/clean.mjs
```

## Known Issues

Deploying artifacts as Object Storage.

> There is an issue in Terraform `oracle/oci` provider on version `v5.25.0`. It is not updated to the specific version of `terraform-plugin-sdk` that fix the underlying gRCP limit of 4Mb.
>
> The project would want to upload artifacts to Object Storage, like the backend jar file, which is bigger than 4Mb.
>
> ```terraform
> data "local_file" "backend_jar_tgz" {
>   filename = "${path.module}/../../.artifacts/backend_jar.tar.gz"
> }
> ```
>
> As a workaround, a `script/deliver.mjs` script and a `script/clean.mjs` script will deliver and clean the artifacts into Object Storage and make Pre-Authenticated Requests available for Terraform resources.
