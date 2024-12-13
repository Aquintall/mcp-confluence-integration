import { ReadResourceRequestSchema, Resource, ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types';
import { ConfluenceServer } from '../ConfluenceServer';
import { ConfluenceService } from '../services/confluence';

export function setupResourceHandlers(server: ConfluenceServer, confluenceService: ConfluenceService) {
    server.setRequestHandler(
        ListResourcesRequestSchema,
        async () => {
            const resources = await confluenceService.getSpaceContent('MAIN');
            return {
                resources: resources.map(content => ({
                    uri: `confluence://MAIN/${content.id}`,
                    name: content.title,
                    mimeType: 'text/html'
                }))
            };
        }
    );

    server.setRequestHandler(
        ReadResourceRequestSchema,
        async (request) => {
            const uri = request.params.uri;
            if (!uri.startsWith('confluence://')) {
                throw new Error('Invalid resource URI scheme');
            }

            const [, space, pageId] = uri.split('/');
            if (!space || !pageId) {
                throw new Error('Invalid resource URI format');
            }

            const page = await confluenceService.getPage(pageId);
            
            return {
                contents: [{
                    uri,
                    mimeType: 'text/html',
                    text: page.body?.storage.value || 'No content'
                }]
            };
        }
    );
}