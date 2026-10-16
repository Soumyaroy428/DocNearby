import { handleGetSavedProviders, handlePostSaveProvider } from '@/server/api/user-saved-providers';

export const GET = handleGetSavedProviders;
export const POST = handlePostSaveProvider;
