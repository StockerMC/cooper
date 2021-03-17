import CoopCommand from '../../core/entities/coopCommand';
import MessagesHelper from '../../core/entities/messages/messagesHelper';

// Work around duie to Heroku hosting not seeming to like fs/promises import.
import { default as fsWithCallbacks } from 'fs';
const fs = fsWithCallbacks.promises

const isFolder = (path) => {
	if (path[path.length - 1] === '/') return true;

	if (!path.includes('.')) return true;

	return false;
}


export default class SourceCommand extends CoopCommand {

	constructor(client) {
		super(client, {
			name: 'source',
			group: 'community',
			memberName: 'source',
			aliases: ['src'],
			description: 'Get the source of a file.',
			details: ``,
			examples: ['source', 'source example']
		});
	}

	static async getFileContent(path) {
		// Figure out project root.
		try {
			// Prevent access to secure data.
			if (path === '.env' || path === './.env')
				throw new Error('Tried to access .env file.');

			// Load the file content.
			const file = await fs.readFile(path, "utf8");
			return file;

		} catch(e) {
			console.log(`'Error getting file: ${path}`);
			console.error(e);
			return null;
		}
	}

	static async getFolderContent(path) {
		// Prevent loading node_modules... retarded.
		if (path === 'node_modules/' || path === './node_modules/')
			return null;

		try {
			// Load the file content.
			const folder = await fs.readdir(path, "utf8");
			return folder;

		} catch(e) {
			console.log(`'Error getting file: ${path}`);
			console.error(e);
			return null;
		}
	}

	async run(msg) {
		super.run(msg);

		try {
			const gitBaseUrl = `https://github.com/lmf-git/cooper/tree/master/`;

			// Calculate and output file source.
			const intendedPath = msg.content
				.replace('!src ', '')
				.replace('!source ', '').trim();

			// If intended path is a folder, show the files in that folder instead.
			if (isFolder(intendedPath)) {

				const rawFolderContent = await SourceCommand.getFolderContent(intendedPath);

				// Guard invalid path.
				if (!rawFolderContent) 
					return MessagesHelper.selfDestruct(msg, `Could not load the folder (${intendedPath}).`, 666, 15000);
	
				// Decide if it will fit in an embed or not.
				if (rawFolderContent.length > 0) {
					// Form the folder content feedback.
					const folderContent = `**Cooper's source (${intendedPath}):**\n` +
						`<${gitBaseUrl}${intendedPath.replace('./', '')}>\n\n` +

						// TODO: Add distance/breadcrumbs from root here.

						`-- :file_folder: ${intendedPath}\n` +
						`${rawFolderContent.map(folderItem => 
							`---- ${!isFolder(folderItem) ? ':minidisc:' : 'file_folder'} ${folderItem}`
						).join('\n')}`;

					// Output the display text lines of the folders.
					MessagesHelper.selfDestruct(msg, folderContent, 666, 15000);

				} else 
					MessagesHelper.selfDestruct(msg, `${intendedPath} is empty/invalid folder.`, 666, 15000);
				
			// File loading intended instead.
			} else {
				// Load the raw file source code.
				const rawFileContent = await SourceCommand.getFileContent(intendedPath);
	
				// Add file path comment to the top of the code.
				const fileContent = `// ${intendedPath}\n// ${gitBaseUrl}${intendedPath}\n\n`;
	
				// Guard invalid path.
				if (!rawFileContent) 
					return MessagesHelper.selfDestruct(msg, `Could not load the file for ${intendedPath}.`, 666, 15000);
	
				// Decide if it will fit in an embed or not.
				if (rawFileContent.length > 1000 - 20)
					MessagesHelper.selfDestruct(msg, fileContent.replace(gitBaseUrl + intendedPath, `<${gitBaseUrl + intendedPath}>`)
						+ `Source code too verbose (${rawFileContent.length}/980 chars), please view on Github.`, 666, 15000);
				else 
					MessagesHelper.selfDestruct(msg, `\`\`\`js\n${fileContent + rawFileContent}\n\`\`\``, 666, 15000);
			}


		} catch(e) {
			console.error(e);
		}
    }
    
};