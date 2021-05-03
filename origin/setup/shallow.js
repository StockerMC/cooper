import { Client } from 'discord.js-commando';
import Database from './database';
import dotenv from 'dotenv';



// v DEV IMPORT AREA v
import COOP, { ITEMS } from '../coop';
// ^ DEV IMPORT AREA ^

// Load ENV variables.
dotenv.config();


// Commonly useful.
// const listenReactions = (fn) => COOP.STATE.CLIENT.on('messageReactionAdd', fn);
// const listenMessages = (fn) => COOP.STATE.CLIENT.on('message', fn);

const shallowBot = async () => {
    // Instantiate a CommandoJS "client".
    COOP.STATE.CLIENT = new Client({ owner: '786671654721683517' });

    // Connect to Postgres database.
    await Database.connect();
    
    // Login, then wait for the bot to be fully online before testing.
    await COOP.STATE.CLIENT.login(process.env.DISCORD_TOKEN);
    COOP.STATE.CLIENT.on('ready', async () => {
        console.log('Shallow bot is ready');
        // DEV WORK AND TESTING ON THE LINES BELOW.

        // ITEMS.add('431178585089245184', 'LEADERS_SWORD', 1, 'Fixing election')

        // DEV WORK AND TESTING ON THE LINES ABOVE.
    });
};

shallowBot();