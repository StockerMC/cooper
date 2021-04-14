


import CoopCommand from '../../operations/activity/messages/coopCommand';
import MessagesHelper from '../../operations/activity/messages/messagesHelper';
import TodoHelper from '../../operations/productivity/todos/todoHelper';
import COOP, { MESSAGES, TIME } from '../../origin/coop';

export default class TodosCommand extends CoopCommand {

	constructor(client) {
		super(client, {
			name: 'todos',
			group: 'productivity',
			memberName: 'todos',
			aliases: ['mytodos'],
			description: 'Information todo our fine community!',
			details: `Details`,
			examples: ['todo', 'todo example?'],
			arguments: [
				{
					key: 'category',
					prompt: 'TODO category? (GENERAL)',
					type: 'string',
					default: 'GENERAL'
				},
				{
					key: 'targetUser',
					prompt: 'Whose items are you trying to check?',
					type: 'user',
					default: ''
				},
			]
		});
	}

	async run(msg, { category, targetUser }) {
		super.run(msg);

		// Allow them to shorthand it with a dot.
		if (category === '.') category = 'GENERAL';

		// Allow shorthand and blank options on target user.
		if (!targetUser) {
			const firstMention = msg.mentions.users.first();
			if (firstMention) targetUser = firstMention
			else targetUser = msg.author;
		}


		const todos = await TodoHelper.getUserTodos(targetUser.id, category);

        const secsNow = TIME._secs();
        const dueReadable = due => TIME.humaniseSecs(due - secsNow);

        const userTodosText = `**${targetUser}'s todos:**\n\n` +
            todos.map(
                // TODO: Bold/underline the due date if overdue...
                todo => `#${todo.id}. ${todo.title} - ${dueReadable(todo.due)}`
            ).join('\n') +
            `\n\n_Type and send "!todos" to check yours._`;

		MESSAGES.silentSelfDestruct(msg, userTodosText);
    }    
}