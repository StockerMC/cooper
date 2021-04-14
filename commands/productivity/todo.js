import CoopCommand from '../../operations/activity/messages/coopCommand';
import TodoHelper from '../../operations/productivity/todos/todoHelper';
import { MESSAGES, TIME } from '../../origin/coop';

export default class TodoCommand extends CoopCommand {

	constructor(client) {
		super(client, {
			name: 'todo',
			group: 'productivity',
			memberName: 'todo',
			aliases: ['td'],
			description: 'Information todo our fine community!',
			details: `Details`,
			examples: ['todo', 'todo example?'],
			arguments: [
				{
					key: 'title',
					prompt: 'TODO title?',
					type: 'string',
				},
				{
					key: 'due',
					prompt: 'TODO deadline? Ex. 1d, 5h, 10secs',
					type: 'string',
				},
				{
					key: 'category',
					prompt: 'TODO category? (all)',
					type: 'string'
				},
			]
		});
	}

	async run(msg, title, due, category) {
		super.run(msg);

		// Take human readable due time.
		const dueDate = TIME.parseHuman(due);

		// Invalid input time feedback
		if (isNaN(dueDate))
			return MESSAGES.silentSelfDestruct(msg, `<@${msg.author.id}>, ${due} is invalid duration for a todo task.`);


		// Calculate unix secs for due/deadline.
		const dueSecs = Math.round(dueDate.getTime() / 1000);

		// Add a TODO for this user.
		const result = await TodoHelper.add(msg.author.id, {
			title, due: dueSecs, category
		});
		
		// Handle already exists error
		if (result === 'ALREADY_EXISTS')
			return MESSAGES.silentSelfDestruct(msg, `<@${msg.author.id}>, you already have a todo entry with that title!`);
		
		// Feedback.
		const deadline = TIME.humaniseSecs(dueSecs);
		return MESSAGES.silentSelfDestruct(msg, `<@${msg.author.id}>, your todo was created!\n\n` +
			title +
			`\n\nDeadline: ${deadline}`);
    }    
}