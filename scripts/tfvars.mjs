#!/usr/bin/env zx

import Mustache from "mustache";
import { readEnvJson } from "./lib/utils.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await generateTFVars();

async function generateTFVars() {
  const {
    compartmentId,
    compartmentName,
    regionName,
    tenancyId,
    genAiModel,
    publicKeyContent,
    certFullchain,
    certPrivateKey,
    artifacts,
  } = await readEnvJson();

  const webArtifactUrl = artifacts["web"].fullPath;
  const backendArtifactUrl = artifacts["backend_jar"].fullPath;
  const ansibleWebArtifactUrl = artifacts["ansible_web"].fullPath;
  const ansibleBackendArtifactUrl = artifacts["ansible_backend"].fullPath;

  const genaiEndpoint = `https://inference.generativeai.${regionName}.oci.oraclecloud.com`;

  const tfVarsPath = "deployment/terraform/terraform.tfvars";

  const tfvarsTemplate = await fs.readFile(`${tfVarsPath}.mustache`, "utf-8");

  const output = Mustache.render(tfvarsTemplate, {
    tenancyId,
    regionName,
    compartmentId,
    ssh_public_key: publicKeyContent,
    cert_fullchain: certFullchain,
    cert_private_key: certPrivateKey,
    web_artifact_url: webArtifactUrl,
    backend_artifact_url: backendArtifactUrl,
    ansible_web_artifact_url: ansibleWebArtifactUrl,
    ansible_backend_artifact_url: ansibleBackendArtifactUrl,
    genai_endpoint: genaiEndpoint,
    genai_model_id: genAiModel,
  });

  console.log(
    `Terraform will deploy resources in ${chalk.green(
      regionName
    )} in compartment ${
      compartmentName ? chalk.green(compartmentName) : chalk.green("root")
    }`
  );

  await fs.writeFile(tfVarsPath, output);

  console.log(`File ${chalk.green(tfVarsPath)} created`);

  console.log(`1. ${chalk.yellow("cd deployment/terraform/")}`);
  console.log(`2. ${chalk.yellow("terraform init")}`);
  console.log(`3. ${chalk.yellow("terraform apply -auto-approve")}`);
}
