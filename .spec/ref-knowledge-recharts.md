# Reference: Recharts 3.x Knowledge Base

API validada para componentes Recharts usados en ECG Simulator 2.

---

## 1. Versión y Compatibilidad

| Item | Valor |
|------|-------|
| Versión en proyecto | 3.3 (package.json) |
| Versión más reciente | 3.8.1 (recharts.org) |
| Compatibilidad React 19 | ✅ Soportado en 3.x (merge defaultProps fix) |
| Bundle | ~5.67 MB, SVG-based, D3 submodules |
| Install | `npm install recharts react-is` |

Fuente: recharts.org; GitHub recharts/recharts issue #4558

---

## 2. Componentes Principales

### ResponsiveContainer
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>...</LineChart>
</ResponsiveContainer>
```
- Usa ResizeObserver API
- width/height: number o "%" string
- Prop aspect: width/height ratio
- Prop debounce: delay en ms para resize
- Prop minWidth, minHeight, maxHeight

### LineChart
```tsx
<LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
```
- data: array de objetos
- margin: espaciado interno
- syncId: sincroniza tooltip entre charts hermanos

### Line
```tsx
<Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2}
  dot={false}  // ocultar dots
  dot={<CustomDot />}  // custom dot component (recibe cx, cy, payload, value)
  activeDot={{ r: 8 }}
  isAnimationActive={false}  // desactivar animación (útil para ECG)
/>
```
- type: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter"
- dataKey: key del objeto data
- dot: boolean o ReactElement
- connectNulls: conectar puntos null

### CartesianGrid
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
<CartesianGrid horizontal={true} vertical={false} />  // solo grid horizontal
```

### XAxis / YAxis
```tsx
<XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
<YAxis domain={[0, 'dataMax + 100']} />
<YAxis hide={true} />  // ocultar eje
```
- domain: [min, max] array
- tickFormatter: function para formatear ticks
- allowDecimals: boolean
- orientation: "top" | "bottom" (XAxis)
- label: { value, position, offset }

### Tooltip
```tsx
<Tooltip
  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
  formatter={(value, name) => [`${value}`, name]}
/>
```

### ReferenceLine
```tsx
<ReferenceLine y={0} stroke="red" strokeDasharray="3 3" label="Línea base" />
```
- x / y: posición
- ifOverflow: "visible" | "hidden" | "extendDomain"

### ReferenceArea
```tsx
<ReferenceArea x1="Jan" x2="Mar" fill="#8884d8" fillOpacity={0.3} />
```
- x1, x2, y1, y2: límites del área

### Legend
```tsx
<Legend
  verticalAlign="top"  // "top" | "bottom"
  align="right"        // "left" | "center" | "right"
/>
```

### Label
```tsx
<Label value="Eje X" position="bottom" />
```

---

## 3. Custom Dot (usado en ECG)

```tsx
const CustomDot = (props: any) => {
  const { cx, cy, payload, value } = props;
  // cx, cy: coordenadas calculadas por Recharts
  // payload: objeto data original
  // value: valor de dataKey
  return <circle cx={cx} cy={cy} r={3} fill="black" />;
};
```

Uso en ECG: los dots se desactivan (`dot={false}`) porque la línea debe ser continua. El trazado ECG se dibuja como línea sin puntos.

---

## 4. Patrón ECG con Recharts

```tsx
<ResponsiveContainer width="100%" height={180}>
  <LineChart data={leadData} syncId="ecg">
    <CartesianGrid
      horizontal={true}
      vertical={true}
      stroke="#e0e0e0"
      strokeDasharray="1 1"
    />
    <XAxis dataKey="time" hide={true} />
    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide={true} />
    <Line
      type="linear"
      dataKey="value"
      stroke="#000"
      strokeWidth={1.5}
      dot={false}
      isAnimationActive={false}
    />
  </LineChart>
</ResponsiveContainer>
```

Features importantes para ECG:
- `syncId` para sincronizar tooltip entre derivaciones
- `isAnimationActive={false}` para evitar animaciones (datos médicos)
- `dot={false}` para línea continua
- `type="linear"` para segmentos rectos entre puntos (no monotone que suaviza)

---

## 5. Buenas Prácticas

- Siempre usar `ResponsiveContainer` para responsive design
- No animar datos ECG (isAnimationActive=false)
- Usar syncId para múltiples charts sincronizados
- Para líneas ECG: type="linear" (no monotone — puede distorsionar ondas)
- Para grids de papel ECG: strokeDasharray="1 1" para líneas finas, strokeDasharray="4 4" para líneas gruesas
- La FC debe calcularse desde approximateBpm, NO parsearse de texto

---

## 6. Fuentes

| Fuente | URL |
|--------|-----|
| Recharts Official | https://recharts.org/en-US/api |
| Recharts GitHub | https://github.com/recharts/recharts |
| ResponsiveContainer API | https://recharts.org/en-US/api/ResponsiveContainer |
| LineChart examples | https://recharts.org/en-US/examples |
| Recharts Storybook | https://recharts.org/en-US/storybook |
