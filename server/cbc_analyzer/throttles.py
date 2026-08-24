from rest_framework.throttling import UserRateThrottle


class CBCAnalyzeThrottle(UserRateThrottle):
    """
    Per-clinician ceiling on analyzer runs.

    The endpoint is professional-only and already behind authentication, so this
    exists to bound Gemini spend on a runaway client rather than to ration the
    feature — the rate is set well above a realistic clinic day.
    """

    scope = "cbc_analyze_user"
