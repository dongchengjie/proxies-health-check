/**
 * Logger adapter - wraps GitHub Actions core logger
 */

import core from "@actions/core";
import type { Logger } from "../domain/health-check-service";

export class ActionsLogger implements Logger {
  info(message: string): void {
    core.info(message);
  }

  error(message: string): void {
    core.error(message);
  }

  warning(message: string): void {
    core.warning(message);
  }
}
