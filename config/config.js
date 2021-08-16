require('dotenv').config();//instatiate environment variables

CONFIG = {} //Make this global to use all over the application

CONFIG.app          = process.env.APP   || 'development';
CONFIG.port         = process.env.PORT  || '3000';

CONFIG.db_dialect   = process.env.DB_DIALECT    || 'mongo';
CONFIG.db_host      = process.env.DB_HOST       || 'localhost';
CONFIG.db_port      = process.env.DB_PORT       || '27017';
CONFIG.db_name      = process.env.DB_NAME       || 'name';
CONFIG.db_user      = process.env.DB_USER       || 'root';
CONFIG.db_password  = process.env.DB_PASSWORD   || 'db-password';

CONFIG.db_uri  = process.env.MONGODB_URI   || 'mongodb://localhost:27017/storeDB';


CONFIG.jwt_encryption  = process.env.JWT_ENCRYPTION || 'jwt_please_change';
CONFIG.jwt_expiration  = process.env.JWT_EXPIRATION || '10000';


CONFIG.sms_enable  = process.env.SMS_ENABLE || 'false';


CONFIG.sms_auth_key  = process.env.SMS_AUTH_KEY || 'key here';
CONFIG.sms_sender_id  = process.env.SMS_SENDER_ID || 'EXAMPLE';
CONFIG.sms_route_id  = process.env.SMS_ROUTE_ID || '4';



