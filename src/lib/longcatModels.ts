export const LONGCAT_DEFAULT_MODEL = 'LongCat-2.0-Preview' as const

export const LONGCAT_MODEL_LABEL = 'LongCat 2.0 Preview'

export const LONGCAT_ALLOWED_MODELS = [LONGCAT_DEFAULT_MODEL] as const

export type LongCatModel = (typeof LONGCAT_ALLOWED_MODELS)[number]

export function normalizeLongCatModel(model?: string | null): LongCatModel {
  return LONGCAT_ALLOWED_MODELS.includes(model as LongCatModel)
    ? (model as LongCatModel)
    : LONGCAT_DEFAULT_MODEL
}
