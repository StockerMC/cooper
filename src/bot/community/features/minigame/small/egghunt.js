import { map as _map, values as _values } from 'lodash';

import EMOJIS from '../../../../core/config/emojis.json';

import ChannelsHelper from '../../../../core/entities/channels/channelsHelper';
import ServerHelper from '../../../../core/entities/server/serverHelper';
import PointsHelper from '../../points/pointsHelper';
import ItemsHelper from '../../items/itemsHelper';

import STATE from '../../../../state';
import MessagesHelper from '../../../../core/entities/messages/messagesHelper';
import UsersHelper from '../../../../core/entities/users/usersHelper';
import DropTable from '../../items/droptable';


export const EGG_DATA = {
    TOXIC_EGG: {
        points: -5,
        emoji: EMOJIS.TOXIC_EGG
    },
    AVERAGE_EGG: {
        points: 1,
        emoji: EMOJIS.AVERAGE_EGG
    },
    RARE_EGG: {
        points: 3,
        emoji: EMOJIS.RARE_EGG
    },
    LEGENDARY_EGG: {
        points: 20,
        emoji: EMOJIS.LEGENDARY_EGG
    },
};


export default class EggHuntMinigame {
    
    static onReaction(reaction, user) {
        try {
            const isCooperMessage = UsersHelper.isCooperMsg(reaction.message);
            const eggEmojiNames = _map(_values(EGG_DATA), "emoji");
            const emojiIdentifier = MessagesHelper.getEmojiIdentifier(reaction.message);
            const isEgghuntDrop = eggEmojiNames.includes(emojiIdentifier);
            const hasEggRarity = this.calculateRarityFromMessage(reaction.message);
            const isEggCollectible = isCooperMessage && isEgghuntDrop && hasEggRarity;
            
            const isBombEmoji = reaction.emoji.name === '💣';
            const isBasketEmoji = reaction.emoji.name === '🧺';
            const isPanEmoji = reaction.emoji.name === '🍳';

            if (isEggCollectible && isPanEmoji) this.fry(reaction, user);
            if (isEggCollectible && isBasketEmoji) this.collect(reaction, user);
            if (isEggCollectible && isBombEmoji) this.explode(reaction, user);

        } catch(e) {
            console.error(e);
        }
    }

    static calculateRarityFromMessage(msg) {
        let eggRarity = null;

        if (msg.content.indexOf('average_egg') > -1) eggRarity = 'AVERAGE_EGG';
        if (msg.content.indexOf('rare_egg') > -1) eggRarity = 'RARE_EGG';
        if (msg.content.indexOf('legendary_egg') > -1) eggRarity = 'LEGENDARY_EGG';
        if (msg.content.indexOf('toxic_egg') > -1) eggRarity = 'TOXIC_EGG';

        return eggRarity;
    }

    static async processBombDrop(rarity, user) {
        // Ignore toxic eggs for now.
        if (rarity === 'TOXIC_EGG') return false;

        const tierLevel = rarity.replace('_EGG', '');
        const reward = DropTable.getRandomTieredWithQty(tierLevel);

        const actionTypeText = MessagesHelper.randomChars(7);
        const subjectText = `the ${tierLevel.toLowerCase()} egg`;
        const actionText = `${user.username} ${actionTypeText}'d items from bombing ${subjectText}...`;
        const emojiText = MessagesHelper.emojiText(EMOJIS[rarity]);
        const emojiItemText = MessagesHelper.emojiText(EMOJIS[reward.item]);
        const eventText = `${actionText} ${emojiText}\n${emojiItemText} ${reward.item}x${reward.qty}`;
        ChannelsHelper._postToFeed(eventText, 2000);
        
        await ItemsHelper.add(user.id, reward.item, reward.qty);
    }

    // TODO: Add a small chance of bomb exploding on you.
    static async explode(reaction, user) {

        // Check if user has a bomb to use
        try {
            // TODO: Allow all other explosives to do this too.
            const bombQuantity = await ItemsHelper.getUserItemQty(user.id, 'BOMB');

            const rarity = this.calculateRarityFromMessage(reaction.message);
            const reward = EGG_DATA[rarity].points;
            const emoji = EGG_DATA[rarity].emoji;
            const channelName = reaction.message.channel.name;

            // Remove reaction by user without a bomb and prevent usage.
            if (bombQuantity <= 0) return await reaction.users.remove(user.id);

            // Remove bomb from user.
            await ItemsHelper.subtract(user.id, 'BOMB', 1);

            // User has enough eggs, blow egg up.
            const blownupEggMsg = await reaction.message.edit('💥');
            MessagesHelper.delayDelete(blownupEggMsg, 3333);

            // Share points with nearest 5 message authors.
            const channelMessages = reaction.message.channel.messages;
            const surroundingMsgs = await channelMessages.fetch({ around: reaction.message.id, limit: 30 });
            const aroundUsers = surroundingMsgs.reduce((acc, msg) => {
                const notIncluded = typeof acc[msg.author.id] === 'undefined';
                const notCooper = !UsersHelper.isCooperMsg(msg);
                if (notIncluded && notCooper) acc[msg.author.id] = msg.author;
                return acc;
            }, {});

            // Store points and egg collection data in database.
            const awardedUserIDs = Object.keys(aroundUsers);
            await Promise.all(awardedUserIDs.map(userID => PointsHelper.addPointsByID(userID, reward)));

            // Add/update random item to user if it was a legendary egg
            await this.processBombDrop(rarity, user);

            // Create feedback text from list of users.
            const usersRewardedText = awardedUserIDs.map(userID => aroundUsers[userID].username).join(', ');
            const emojiText = MessagesHelper.emojiText(emoji);
            const feedbackMsg = `${usersRewardedText} gained ${reward} points by being splashed by exploding egg ${emojiText}`.trim();

            // Add self-destructing message in channel.
            const instantFeedbackMsg = await reaction.message.say(feedbackMsg);
            MessagesHelper.delayDelete(instantFeedbackMsg, 30000);

            // Add server notification in feed.
            await ChannelsHelper._postToFeed(feedbackMsg + ' in ' + channelName);

        } catch(e) {
            console.error(e);
        }
    }

    static async fry(reaction, user) {
        try {
            // Attempt to use the laxative item
            const didUsePan = await ItemsHelper.use(user.id, 'FRYING_PAN', 1);
    
            // Respond to usage result.
            if (didUsePan) {
                const rarity = this.calculateRarityFromMessage(reaction.message);
                const { points, emoji } = EGG_DATA[rarity];
    
                // Invert rewards, good egg cooked is wasting, bad egg cooked is rewarding.
                const actionReward = -points;   
    
                // Process the points change.
                const updatedPoints = await PointsHelper.addPointsByID(user.id, actionReward);
    
                // TODO: Create omelette item after being cooked.
    
                // Generate feedback test based on the changes.
                const feedbackText = `${user.username} fried <${emoji}>! ` +
                    `Resulting in ${actionReward} point(s) change. (${updatedPoints})`;
                
                // Delete the original egg, now it has been fried.
                await reaction.message.delete();

                setTimeout(async () => {
                    if (!ChannelsHelper.checkIsByCode(reaction.message.channel.id, 'FEED')) {
                        const feedbackMsg = await reaction.message.say(feedbackText);
                        setTimeout(() => { feedbackMsg.react('🍳'); }, 1333);
                        setTimeout(() => { feedbackMsg.delete(); }, 10000);
                    }
                    setTimeout(() => { ChannelsHelper._postToFeed(feedbackText); }, 666);
                }, 333)
            } else {
                const unableMsg = await reaction.message.say('Unable to use FRYING_PAN, you own none. :/');
                setTimeout(() => { reaction.users.remove(user.id); }, 666);
                setTimeout(() => { unableMsg.react('🍳'); }, 1333);
                setTimeout(() => { unableMsg.delete(); }, 10000);
            }
        } catch(e) {
            console.log('Frying egg failed...');
            console.error(e);
        }
    }

    static async collect(reaction, user) {
        try {
            if (reaction.count > 2) 
                return MessagesHelper.selfDestruct(reaction.message, 'That egg was just taken before you...');

            if (!UsersHelper.isCooper(user.id)) {
                const rarity = this.calculateRarityFromMessage(reaction.message);
                const reward = EGG_DATA[rarity].points;
                const rewardPolarity = reward > 0 ? '+' : '';
                const emoji = EGG_DATA[rarity].emoji;

                // Check the channel type or location of the action.
                let location = null;
                if (reaction.message.channel.type === 'dm') location = 'direct message'
                else location = `"${reaction.message.channel.name}" channel`;

                // Setup the text for feedback messages.
                const actionText = `<${emoji}>🧺 Egg Hunt! ${user.username}`;
                let acknowledgementMsgText =`${actionText} ${rewardPolarity}${reward} points!`.trim();
                let activityFeedMsgText = `${user.username} collected an egg in ${location}! <${emoji}>`.trim();

                // TODO: If Cooper is evil you break more pickaxes, axes, frying pans and eggs.

                if (STATE.CHANCE.bool({ likelihood: 83 })) {
                    // Store points and egg collection data in database.
                    const updated = await PointsHelper.addPointsByID(user.id, reward);
                    acknowledgementMsgText += ` (${updated})`;
                    // Add/update egg item to user
                    await ItemsHelper.add(user.id, rarity, 1);
                    
                    MessagesHelper.selfDestruct(reaction.message, acknowledgementMsgText, 666, 30000);

                    // Animate the egg collection.
                    const emojiText = MessagesHelper.emojiText(EGG_DATA[rarity].emoji);
                    const basketEmojiText = MessagesHelper.emojiText(EMOJIS.BASKET);
                    MessagesHelper.delayEdit(reaction.message, `${emojiText}${basketEmojiText}💨`, 333);
                    MessagesHelper.delayDelete(reaction.message, 3000);
                } else {
                    acknowledgementMsgText = `${actionText} clumsily broke the egg, 0 points!`.trim();
                    activityFeedMsgText = `${user.username} broke an egg in ${location}! :( <${emoji}>`.trim();
                    MessagesHelper.selfDestruct(reaction.message, acknowledgementMsgText, 666, 30000);
                    MessagesHelper.delayDelete(reaction.message, 0);
                }

                // Provide record of event.
                ChannelsHelper._postToFeed(activityFeedMsgText)                
            }
        } catch(e) {
            console.error(e);
        }
    }

    static async drop(rarity, dropText = null) {
        const server = ServerHelper.getByCode(STATE.CLIENT, 'PROD');
        const dropChannel = ChannelsHelper.fetchRandomTextChannel(server);
        
        if (dropChannel) {
            const randomDelayBaseMs = 30000;
            setTimeout(async () => {
                try {
                    const emojiText = MessagesHelper.emojiText(EGG_DATA[rarity].emoji);
                    const eggMsg = await dropChannel.send(emojiText);

                    // Add collection action emoji.
                    MessagesHelper.delayReact(eggMsg, '🧺', 666);

                    // Remove toxic egg after few minutes so people aren't forced to take it.
                    if (rarity === 'TOXIC_EGG') MessagesHelper.delayDelete(eggMsg, 200000);

                    if (dropText) ChannelsHelper._postToFeed(dropText);
                } catch(e) {
                    console.error(e);
                }
            }, STATE.CHANCE.natural({ min: randomDelayBaseMs, max: randomDelayBaseMs * 4 }));
        }
    }

    static async dmDrop(rarity) {
        try {
            const randomMember = await UsersHelper._random();
            const name = randomMember.user.username;
            const emojiText = MessagesHelper.emojiText(EGG_DATA[rarity].emoji);

            // Send via DM.
            const eggMsg = await randomMember.send(emojiText);
            MessagesHelper.delayReact(eggMsg, '🧺', 333);

            // Remove toxic egg after 5 minutes so people aren't forced to take it.
            if (rarity === 'TOXIC_EGG') MessagesHelper.delayDelete(eggMsg, 300000);

            // Provide feedback.
            let dropText = `${name} was sent an egg via DM! ${emojiText}`;
            if (rarity === 'LEGENDARY_EGG') dropText = 'OooOoOoOoooo... ' + dropText;
            ChannelsHelper._postToFeed(dropText);
        } catch(e) {
            console.error(e);
        }
    }

    static run() {        
        this.drop('AVERAGE_EGG', 'Whoops! I dropped an egg, but where...?');

        if (STATE.CHANCE.bool({ likelihood: 40 })) {
            this.drop('TOXIC_EGG', 'I dropped an egg, but where...? Tsk.');

            if (STATE.CHANCE.bool({ likelihood: 7.5 })) {
                this.drop('RARE_EGG', 'Funknes! Rare egg on the loose!');

                if (STATE.CHANCE.bool({ likelihood: 2.5 })) {
                    ChannelsHelper._postToFeed('A legendary egg was dropped! Find and grab it before others can!');
                    this.drop('LEGENDARY_EGG');
                }
            }
        }

        // Handle DM dropping
        if (STATE.CHANCE.bool({ likelihood: 1.35 })) this.dmDrop('TOXIC_EGG');
        if (STATE.CHANCE.bool({ likelihood: 3.85 })) this.dmDrop('AVERAGE_EGG');
        if (STATE.CHANCE.bool({ likelihood: 2.45 })) this.dmDrop('RARE_EGG');
        if (STATE.CHANCE.bool({ likelihood: 0.025 })) this.dmDrop('LEGENDARY_EGG');

        // Bonus eggs            
        if (STATE.CHANCE.bool({ likelihood: 6.5 })) {           
            let bonusEggsNum = STATE.CHANCE.natural({ min: 5, max: 25 });
            if (STATE.CHANCE.bool({ likelihood: 3.5 })) {
                bonusEggsNum = STATE.CHANCE.natural({ min: 10, max: 45 });
                ChannelsHelper._postToFeed('Bonus eggs hurtling!');
            } else 
                ChannelsHelper._postToFeed('Bonus eggs rolling!');

            for (let i = 0; i < bonusEggsNum; i++) this.drop('AVERAGE_EGG', null);

            const toxicEggsMixupNum = STATE.CHANCE.natural({ min: 1, max: Math.floor(bonusEggsNum / 2.5) });
            for (let i = 0; i < toxicEggsMixupNum; i++) this.drop('TOXIC_EGG', null);
        }
    }
}