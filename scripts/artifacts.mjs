#!/usr/bin/env zx

import { readEnvJson, writeEnvJson } from "./lib/utils.mjs";
import {
  createBucket,
  createPARObject,
  getBucket,
  listPARs,
  putObject,
} from "./lib/oci.mjs";
import moment from "moment";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const expirationOffsetInDays = 7;

await collectArtifacts();
await deliverArtifacts();

async function collectArtifacts() {
  const artifactsFolderPath = path.join(__dirname, "..", ".artifacts");
  await $`mkdir -p ${artifactsFolderPath}`;
  const backendJarPath = "backend/build/libs/backend-0.0.1.jar";
  if (!(await fs.pathExists(backendJarPath))) {
    console.log(
      `Build backend (JAVA): ${chalk.yellow(
        "./gradlew bootJar"
      )} from ${chalk.yellow("backend")} folder`
    );
    exitWithError(`Path ${backendJarPath} does not exist`);
  }
  const webDistPath = "web/dist";
  if (!(await fs.pathExists(webDistPath))) {
    console.log(
      `Build web (static content): ${chalk.yellow(
        "npm run build"
      )} from ${chalk.yellow("web")} folder`
    );
    exitWithError(`Path ${webDistPath} does not exist`);
  }
  const pwd = (await $`pwd`).stdout.trim();
  await $`cd ${path.dirname(backendJarPath)} \
    && tar -czf ${artifactsFolderPath}/backend_jar.tar.gz ./* \
    && cd ${pwd}`;
  console.log(`File ${chalk.green("backend_jar.tar.gz")} gzipped`);
  await $`cd ${webDistPath} && tar -czf ${artifactsFolderPath}/web.tar.gz ./* && cd ${pwd}`;
  console.log(`File ${chalk.green("web.tar.gz")} gzipped`);

  // deployment/ansible/backend
  await $`cd deployment/ansible/backend && \
    tar -czf ${artifactsFolderPath}/ansible_backend.tar.gz ./* && \
    cd ${pwd}`;
  console.log(`File ${chalk.green("ansible_backend.tar.gz")} gzipped`);
  await $`cd deployment/ansible/web && \
    tar -czf ${artifactsFolderPath}/ansible_web.tar.gz ./* && \
    cd ${pwd}`;
  console.log(`File ${chalk.green("ansible_web.tar.gz")} gzipped`);
}

async function deliverArtifacts() {
  let properties = await readEnvJson();
  if (!properties.artifacts) properties.artifacts = {};
  const { compartmentId } = properties;

  const bucketName = "genai_artifacts";

  properties.bucketName = bucketName;
  await writeEnvJson(properties);

  const bucket = await getBucket(compartmentId, bucketName);

  if (!bucket) {
    await createBucket(compartmentId, bucketName);
    console.log(`Bucket ${chalk.green(bucketName)} created`);
  }

  const objects = [
    { objectName: "backend_jar", filePath: ".artifacts/backend_jar.tar.gz" },
    { objectName: "web", filePath: ".artifacts/web.tar.gz" },
    {
      objectName: "ansible_backend",
      filePath: ".artifacts/ansible_backend.tar.gz",
    },
    { objectName: "ansible_web", filePath: ".artifacts/ansible_web.tar.gz" },
  ];

  const expiration = moment().add(expirationOffsetInDays, "days").toISOString();

  const pars = await listPARs(bucketName);

  objects.forEach(async ({ objectName, filePath }) => {
    if (!(await fs.pathExists(filePath))) {
      exitWithError(`Path ${filePath} does not exist`);
    }
    await putObject(bucketName, objectName, filePath);
    console.log(
      `File ${chalk.green(filePath)} uploaded to ${chalk.green(
        bucketName
      )} as ${chalk.green(objectName)}`
    );
    const fullPath = await createPARIfNotExist(
      pars,
      bucketName,
      objectName,
      expiration
    );
    properties.artifacts[objectName] = { ...properties.artifacts[objectName] };
    if (fullPath) {
      properties.artifacts[objectName].fullPath = fullPath;
    }
    await writeEnvJson(properties);
  });
}

async function createPARIfNotExist(pars, bucketName, objectName, expiration) {
  const existingPar = pars.find((par) => par["object-name"] === objectName);
  if (existingPar) {
    console.log(
      `Existing PAR for ${chalk.green(
        objectName
      )} and will expire on the ${chalk.green(existingPar["time-expires"])}`
    );
    return;
  }
  const fullPath = await createPARObject(bucketName, objectName, expiration);
  console.log(
    `PAR created for ${chalk.green(
      objectName
    )} and will expire in ${chalk.green(
      expirationOffsetInDays
    )} days on the ${chalk.green(expiration)}`
  );
  return fullPath;
}
