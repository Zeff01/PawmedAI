"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const register = (req, res) => {
    res.status(200).send('Welcome to the registration page!');
};
exports.register = register;
const login = (req, res) => {
    res.status(200).send('Welcome to the login page!');
};
exports.login = login;
