import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { hairline, spacing, useTheme } from '@/theme';

export interface Option<V extends string> {
  value: V;
  label: string;
  description?: string;
}

interface Base<V extends string> {
  options: Option<V>[];
}

interface Single<V extends string> extends Base<V> {
  multi?: false;
  value: V | null;
  onChange: (value: V) => void;
}

interface Multi<V extends string> extends Base<V> {
  multi: true;
  value: V[];
  onChange: (value: V[]) => void;
}

export type OptionListProps<V extends string> = Single<V> | Multi<V>;

/** Lista de opções em linhas com divisor; a selecionada mostra um visto. */
export function OptionList<V extends string>(props: OptionListProps<V>) {
  const t = useTheme();
  const selected = (v: V) => (props.multi ? props.value.includes(v) : props.value === v);
  const toggle = (v: V) => {
    if (props.multi) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else {
      props.onChange(v);
    }
  };
  return (
    <View>
      {props.options.map((o, i) => {
        const isSel = selected(o.value);
        return (
          <Pressable
            key={o.value}
            accessibilityRole={props.multi ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: isSel }}
            onPress={() => toggle(o.value)}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomColor: t.border,
                borderBottomWidth: i === props.options.length - 1 ? 0 : hairline,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.text}>
              <Text variant={isSel ? 'bodyStrong' : 'body'}>{o.label}</Text>
              {o.description ? <Text variant="secondary">{o.description}</Text> : null}
            </View>
            <Ionicons name={isSel ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isSel ? t.text : t.border} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: spacing.md },
  text: { flex: 1, gap: 2 },
});
