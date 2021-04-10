// import BuffsHelper, { BUFF_TYPES } from '../../../conquest/buffsHelper';
import { usedOwnedUsableGuard } from '../../itemCmdGuards';

import COOP from '../../../../../../origin/coop';

// What does the rpg do: Start typing squidling.
export default class RPGHandler {

    // Intercept item usages via emoji reactions.
    static async onReaction(reaction, user) {
        const reactEmojiFlake = `:${reaction.emoji.name}:${reaction.emoji.id}`;

        // Confirm reaction is rpg before processing.  
        if (reactEmojiFlake !== COOP.ITEMS.codeToFlake('RPG')) return false;

        // Prevent Cooper from having an effect.
        if (COOP.USERS.isCooper(user.id)) return false;

        // TODO: Add emoji here, Can add another emoji reaction suitable param(?) to pass , ':rpg:'
        // Attempt to use the RPG item
        const used = await usedOwnedUsableGuard(user, 'RPG', 1, reaction.message);
        if (!used) return false;

        // Run the RPG effect.
        // const result = 
            this.runEffect(reaction.message.author, reaction.message, user);
    }


    // Allow people to use the items without having to react to a message.
    static async use(msg) {
        // Attempt to use the rpg item
        const used = await usedOwnedUsableGuard(msg.author, 'RPG', 1, msg);
        if (!used) return false;

        // This gives perfect emoji for sending as reaction.
        // COOP.ITEMS.codeToFlake('RPG')


        // Run effect which also provides feedback.
        this.runEffect(msg.author.id);
        return true;
    }


    static runEffect(target, msg, attacker) {
        console.log('Running RPG effect.');

        // TODO: Add an effect here for RPG
        const rpgEmojiText = COOP.MESSAGES._displayEmojiCode('RPG');
        const targetName = target.id === attacker.id ? 'their self' : `<@${target.id}`;
        const successText = `<@${attacker.id}> used an ${rpgEmojiText} RPG on ${targetName}, blasting them and potentially starting a chain reaction!`;

        COOP.CHANNELS.silentPropagate(msg, successText, 'ATTACKS', true);


        // if (BuffsHelper.has('INVINCIBILITY', targetID))
    }
   
}