import config from './config';
import knex from './knex';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import methodOverride from 'method-override';
import helmet from 'helmet';
import path from 'path';
import multer from 'multer';

/**
 * Server
 * @class
 */
class Server {
  constructor() {
    this.app = express();
    this.initMiddleware();
    this.initSettingJWT();
    this.initModulesServerRoutes();
    this.initHelmetHeaders();
    this.initErrorHandler();
  }

  /**
   * Configure express middleware
   */
  initMiddleware() {
    this.app.use(multer({
      dest: config.file.uploads,
      limits: {
        fileSize: config.file.maxSize,
        files: 1
      }
    }));
    this.app.use(compression({
      // only compress files for the following content types
      filter: (req, res) => {
        return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
      },
      // zlib option for compression level
      level: 3
    }));
    // Showing stack errors
    this.app.set('showStackError', true);
    // Request body parsing middleware should be above methodOverride
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));
    this.app.use(bodyParser.json({limit: '3mb'}));
    this.app.use(methodOverride());
    // Setting the app router and static folder
    //this.app.use(express.static(path.resolve('./public')));
    this.app.use(express.static(path.resolve(config.file.uploads)));
  }

  /**
   * Configure Helmet headers configuration
   */
  initHelmetHeaders() {
    // Use helmet to secure Express headers
    const SIX_MONTHS = 15778476000;

    this.app.use(helmet.xframe());
    this.app.use(helmet.xssFilter());
    this.app.use(helmet.nosniff());
    this.app.use(helmet.ienoopen());
    this.app.use(helmet.hsts({
      maxAge: SIX_MONTHS,
      includeSubdomains: true,
      force: true
    }));
    this.app.disable('x-powered-by');
  }

  /**
   * Configure the modules server routes
   */
  initModulesServerRoutes() {
    // Globbing routing files
    config.routes.forEach((routePath) => {
      require(path.resolve(routePath))(this.app);
    });
  }

  /**
   * Set Token
   */
  initSettingJWT() {
    this.app.use('/api/v1', (req, res, next) => {
      var token = req.headers && req.headers.authorization;

      if (token) {
        knex('user')
          .select([
            'id',
            'name',
            'email',
            'phone'
          ])
          .where({token})
          .then((result) => {
              req.user = result[0];
              if (req.user) {
                return next();
              }
              res.status(401).send();
            }
          )
          .catch(next);
      } else {
        res.status(401).send();
      }
    });
  }

  /**
   * Interception error
   */
  initErrorHandler() {
    // Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
    this.app.use((err, req, res, next) => {
      var
        result = {
          status: "error"
        };

      if (err instanceof Error) {
        result.message = err.message;
        result.detail = err;
      } else {
        result.message = err.msg;
      }
      console.log(result);
      res.status(err.code ? err.code || err.statusCode || err.status : 500).send(result);
    });

    this.app.use((req, res) => {
      res.status(404).send({
        url: req.originalUrl,
        error: 'Not Found'
      });
    });
  }

  async run() {
    this.app.listen(config.port, () => {
      // Logging initialization
      console.log('--');

      console.log('Server run');
      console.log('Port:\t\t', config.port);
      console.log('Database:\t',
        `${config.db.client}://${config.db.connection.user}:${config.db.connection.password}` +
        `@${config.db.connection.host}:${config.db.connection.port}/${config.db.connection.database}`);

      if (config.secure && config.secure.ssl === 'secure') {
        console.log('HTTPs:\t\t\t\ton');
      }

      console.log('--');
    });
  }
}

new Server().run();