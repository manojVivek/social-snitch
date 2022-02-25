import {createClient, SupabaseClient} from '@supabase/supabase-js';

interface SSSupabaseClient extends SupabaseClient {
  getEntity: <T>(entityName: string, query: {[key: string]: any}) => Promise<T>;
  insertEntity: <T>(entityName: string, entity: Partial<T>) => Promise<T>;
  deleteEntities: <T>(entityName: string, query: {[key: string]: any}) => Promise<T[]>;
  getEntities: <T>(entityName: string, query: {[key: string]: any}) => Promise<T[]>;
  updateEntities: <T>(
    entityName: string,
    query: Record<string, string>,
    entity: Partial<T>
  ) => Promise<T[]>;
  ensureEntityExists: <T>(entityName: string, query: Partial<T>) => Promise<T>;
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

  ssClient.getEntities = async <T>(tableName: string, query: Record<string, string> = {}) => {
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

  ssClient.deleteEntities = async <Type>(tableName: string, query: Record<string, string>) => {
    const {data, error} = await client.from<Type>(tableName).delete().match(query);
    if (error) {
      throw error;
    }
    return data;
  };

  ssClient.updateEntities = async <Type>(
    tableName: string,
    query: Record<string, string>,
    entity: Partial<Type>
  ) => {
    const {data, error} = await client
      .from<Type>(tableName)
      .update({...entity, updated_at: new Date().toISOString()})
      .match(query);
    if (error) {
      throw error;
    }
    return data;
  };

  ssClient.ensureEntityExists = async <Type>(
    tableName: string,
    entity: Partial<Type>
  ): Promise<Type> => {
    const data = await ssClient.getEntity<Type>(tableName, entity);
    if (data) {
      return data;
    }
    return ssClient.insertEntity<Type>(tableName, entity);
  };

  return ssClient;
};

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const ssClient = getSSSupabaseClient(client);

export default ssClient;
