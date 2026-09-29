export type SeedanceReferenceFailure = {
  code: "REAL_PERSON_REFERENCE_REQUIRES_ASSET";
  message: string;
};

export function isLasAssetReference(value: string): boolean {
  return /^asset:\/\//i.test(value.trim());
}

export function isRemoteReference(value: string): boolean {
  const v = value.trim();
  return /^https?:\/\//i.test(v) || /^tos:\/\//i.test(v) || isLasAssetReference(v);
}

/**
 * Converts the provider's raw review failure into an actionable UI message.
 * We do not try to guess whether a face is present locally; BytePlus is the
 * authority that performs the review.
 */
export function classifySeedanceReferenceError(
  error: string,
): SeedanceReferenceFailure | null {
  const normalized = error.toLowerCase();
  const isRealPerson =
    normalized.includes("real_person_reference_requires_asset") ||
    normalized.includes("real person") ||
    normalized.includes("real human") ||
    normalized.includes("real people") ||
    normalized.includes("real-person") ||
    normalized.includes("真人") ||
    normalized.includes("真实人物");

  if (!isRealPerson) return null;

  return {
    code: "REAL_PERSON_REFERENCE_REQUIRES_ASSET",
    message:
      "This Seedance reference contains a real person. Add the authorized person/portrait to the LAS material library and use its asset://<ASSET_ID> instead of the raw face image/video. You can still use non-person references for motion, composition, camera language, and style.",
  };
}
