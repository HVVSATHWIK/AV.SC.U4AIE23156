"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVELS = exports.DEFAULT_MIN_LEVEL = exports.createLogger = exports.createHttpTransport = void 0;
var logger_1 = require("./logger");
Object.defineProperty(exports, "createHttpTransport", { enumerable: true, get: function () { return logger_1.createHttpTransport; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
var constants_1 = require("./constants");
Object.defineProperty(exports, "DEFAULT_MIN_LEVEL", { enumerable: true, get: function () { return constants_1.DEFAULT_MIN_LEVEL; } });
Object.defineProperty(exports, "LOG_LEVELS", { enumerable: true, get: function () { return constants_1.LOG_LEVELS; } });
