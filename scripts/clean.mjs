#!/usr/bin/env zx

import { readEnvJson, writeEnvJson } from "./lib/utils.mjs";
import { deleteBucket, getBucket } from "./lib/oci.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

let properties = await readEnvJson();
const { compartmentId, bucketName } = properties;

const bucket = await getBucket(compartmentId, bucketName);

if (bucket) {
  await deleteBucket(bucketName);
  console.log(`Bucket ${chalk.green(bucketName)} deleted (cascade)`);
}

properties.artifacts = {};
properties.bucketName = "";
await writeEnvJson(properties);

await $`rm -rf ./.artifacts`;
