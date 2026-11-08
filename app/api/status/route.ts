import { NextResponse } from "next/server"

import { getEngineStatus } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const status = await getEngineStatus()
    return NextResponse.json({
      ok: true,
      data: {
        engine_enabled: status.engine_enabled,
        market_open: status.market_open,
        market_session: status.market_session,
        circuit_blocked: status.circuit.blocked,
        server_time: status.server_time,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Trading API is unreachable.",
      },
      { status: 503 }
    )
  }
}
