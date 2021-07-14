import { EMOJIS } from '../../../origin/config';
import { CHANNELS, MESSAGES } from '../../../origin/coop';

export default async function memberJoined(member) {

  try {
    const welcomeMessage = await CHANNELS._postToChannelCode('ENTRY', 
      `Hey <@${member.user.id}>, welcome to **The Coop** :coop:.` +
      ` We are an referral/invite only community, please introduce yourself. ${CHANNELS.textRef('INTRO')}`
    );

    // React with coop emoji... because.
    MESSAGES.delayReact(welcomeMessage, EMOJIS.COOP, 333);

    // Send direct message and channel message about next steps.
    await member.send(
      'Welcome to The Coop! View your welcome message and next steps here: ' + 
      MESSAGES.link(welcomeMessage)
    );

    // Notify community:
    const joinAnnouncementText = `**Someone new joined "${member.user.username}": ${CHANNELS.textRef('ENTRY')}!**`;
    CHANNELS._codes(['TALK', 'WELCOME'], joinAnnouncementText);

  } catch(e) {
    console.error(e)
  }
}