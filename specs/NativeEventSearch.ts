import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
export interface Spec extends TurboModule {
  rankByTitle(query: string, titles: string[]): number[];
}
export default TurboModuleRegistry.get<Spec>('NativeEventSearch');
