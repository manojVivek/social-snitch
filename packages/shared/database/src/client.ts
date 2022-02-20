import {createClient, SupabaseClient} from '@supabase/supabase-js';

interface SSSupabaseClient extends SupabaseClient {
  getEntity: <T>(entityName: string, query: {[key: string]: any}) => Promise<T>;
  insertEntity: <T>(entityName: string, entity: Partial<T>) => Promise<T>;
  getAllEntities: <T>(entityName: string, query: {[key: string]: any}) => Promise<T[]>;
}

const getSSSupabaseClient: (client: SupabaseClient) => SSSupabaseClient = client => {
  const ssClient = client as SSSupabaseClient;

  ssClient.getEntity = async <T>(tableName: string, query: Record<string, string>) => {
    const {data, error} = await client.from<T>(tableName).select().match(query).maybeSingle();
    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  };

  ssClient.getAllEntities = async <T>(tableName: string, query: Record<string, string> = {}) => {
    const {data, error} = await client.from<T>(tableName).select().match(query);
    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  };

  ssClient.insertEntity = async <Type>(tableName: string, entity: Partial<Type>): Promise<Type> => {
    const {data, error} = await client.from<Type>(tableName).insert(entity);
    if (error) {
      throw error;
    }
    return data[0];
  };

  return ssClient;
};

const client = createClient(process.env.SUPABASE_URL_V2, process.env.SUPABASE_ANON_KEY_V2);

const ssClient = getSSSupabaseClient(client);

export default ssClient;
