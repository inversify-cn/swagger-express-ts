import 'reflect-metadata';
import { exec } from 'child_process';

export const stopServer = () => {
  exec('killall node || exit(0)');
};


