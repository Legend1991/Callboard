import fs from 'fs';
import path from 'path';

/**
 * Component that finds and loads a config file
 * @class
 */
class Config {
  /**
   * Load config file. Loaded from app/config.js or from path provided by CONFIG environment variable
   */
  load() {
    let configPath = `${process.cwd()}/config.json`;

    if (process.env.CONFIG) {
      configPath = (process.env.CONFIG.indexOf('/') === -1) ?
                      `${process.cwd()}/${process.env.CONFIG}` : path.resolve(process.env.CONFIG);
    }

    if (fs.existsSync(configPath)) {
      return require(configPath);
    }

    throw new Error('Config file was not found');
  }
}

export default new Config().load();