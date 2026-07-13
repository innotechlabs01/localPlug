import { z } from 'zod'

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]), // [lng, lat] GeoJSON order
})

export type Coordinates = z.infer<typeof coordinatesSchema>
export type GeoPoint = z.infer<typeof geoPointSchema>