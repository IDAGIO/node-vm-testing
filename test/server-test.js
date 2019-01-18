import vm from 'vm';
import sinon from 'sinon';
import path from 'path';
import assert from 'assert';
import {transformFileSync} from 'babel-core';

const transpiledCode = transformFileSync(
  path.join(__dirname, '../server.js')
).code;

function getServerInContext() {
  const getHandlers = {};

  const listeners = {
    get: (request) => {
      const fn = getHandlers[request.path];
      const response = {
        sendFile: sinon.spy((filePath) => filePath),
      };
      const next = sinon.spy(() => ({}));
      fn(request, response, next);
      return { response, next };
    },
    listen: sinon.spy(() => ({})),
  };

  const express = () => ({
    get: (getPath, fn) => {
      getHandlers[getPath] = fn;
    },
    listen: listeners.listen,
  });

  const sandbox = {
    express,
    require: (target) => {
      const packages = {
        express,
      };
      return packages[target];
    },
    process: {
      env: {
        PORT: 3000,
      },
    },
  }

  vm.runInContext(transpiledCode, vm.createContext(sandbox));

  return { listeners };
}

describe('Testing server', () => {
  describe('Setup', () => {
    it('Should listen on env port', () => {
      const { listeners } = getServerInContext({}, {}, 'DE', 9001);
      sinon.assert.calledWith(listeners.listen, 3000);
    });

    it('should serve correct file for the path', () => {
      const { listeners } = getServerInContext({}, {}, 'DE', 9001);
      const request = {
        path: '/a',
      };
      const { response } = listeners.get(request);

      const sendFileCall = response.sendFile.getCall(0);
      const sendFilePath = sendFileCall.args[0];

      assert(sendFilePath, 'dist/a.html');
    });
  });
});
