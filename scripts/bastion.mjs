#!/usr/bin/env zx

import { readEnvJson } from "./lib/utils.mjs";
import { getOutputValues } from "./lib/terraform.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const { ssh_bastion_session_backend, ssh_bastion_session_web } =
  await getOutputValues("deployment/terraform");

const { privateKeyPath } = await readEnvJson();

const ssh_command_backend = ssh_bastion_session_backend.replaceAll(
  "<privateKey>",
  privateKeyPath
);

const ssh_command_web = ssh_bastion_session_web.replaceAll(
  "<privateKey>",
  privateKeyPath
);

console.log(`SSH into Backend: ${chalk.yellow(ssh_command_backend)}`);

console.log(`SSH into Web: ${chalk.yellow(ssh_command_web)}`);
