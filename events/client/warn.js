import { Events } from 'discord.js';

export const data = {
    name: Events.Warn,
};

export function execute(message) {
    console.log('-----WARNING-----\n' + message);
}
