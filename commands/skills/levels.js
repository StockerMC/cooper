import SkillsHelper, { SKILLS } from '../../community/features/skills/skillsHelper';
import CoopCommand from '../../core/entities/coopCommand';
import MessagesHelper from '../../core/entities/messages/messagesHelper';


export default class LevelsCommand extends CoopCommand {

	constructor(client) {
		super(client, {
			name: 'levels',
			group: 'skills',
			memberName: 'levels',
			aliases: ['lvls'],
			description: 'This command lets you check your skill level(s)',
			details: `Details of the levels command`,
			examples: ['xp', '!xp laxative'],
			args: [
				{
					key: 'skillCode',
					prompt: 'Which skill to level check?',
					type: 'string',
					default: ''
				},
			],
		});
	}

	async run(msg, { skillCode }) {
		super.run(msg);

		// Shorthand for feedback.
		const username = msg.author.username;

		try {
			// Check if emoji and handle emoji inputs.
			// skillCode = ItemsHelper.interpretskillCodeArg(skillCode);
			skillCode = skillCode.toLowerCase();
			
			if (skillCode === '') {
				// Provide all skills

				const userSkills = await SkillsHelper.getSkills(msg.author.id);

				const allSkillsText = `**${username}'s skill levels:**\n\n` +
					Object.keys(userSkills).map(skillKey => 
							`${skillKey}: Level ${userSkills[skillKey].level}, ` +
							`(${userSkills[skillKey].xp} XP)`
						).join('\n');

				return MessagesHelper.selfDestruct(msg, allSkillsText);
			}

			const skillCodeList = Object.keys(SKILLS);
			const isValid = skillCodeList.includes(skillCode.toUpperCase());

			// Check if input is a valid item code.
			if (!isValid)
				return MessagesHelper.selfDestruct(msg, `Invalid skill code ${skillCode}.`);


			// Calculate
			const level = await SkillsHelper.getLevel(skillCode, msg.author.id);
			const xp = await SkillsHelper.getXP(skillCode, msg.author.id);

			const levelText = `${username} has level ${level} ${skillCode} (${xp}XP)!`
			return MessagesHelper.selfDestruct(msg, levelText);




		} catch(e) {
			console.log('Error getting skill xp.');
			console.error(e);
		}
    }
    
};