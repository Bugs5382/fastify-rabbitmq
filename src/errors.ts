/*
MIT License

Copyright (c) 2026 Shane Froebel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
import createError from "@fastify/error";

export const errors = {
  /** Error if there is an invalid option used during registration. */
  FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS: createError(
    "FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS",
    "Invalid options: %s",
  ),
  /** Error if there is an setup error of the plugin itself. */
  FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS: createError(
    "FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS",
    "Setup error: %s",
  ),
  /** If an invalid usage error was done, this error would pop up. */
  FASTIFY_RABBIT_MQ_ERR_USAGE: createError(
    "FASTIFY_RABBIT_MQ_ERR_USAGE",
    "Usage error: %s",
  ),
};
