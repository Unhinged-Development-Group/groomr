import { Column, Row } from "@react-email/components";
import React from "react";
import { colors } from "./Layout";

interface DetailRowProps {
  label: string;
  value: string;
  bold?: boolean;
}

export function DetailRow({ label, value, bold }: DetailRowProps) {
  return (
    <Row style={{ paddingTop: 6, paddingBottom: 6 }}>
      <Column
        style={{
          width: 100,
          fontSize: 13,
          color: colors.pebbleGrey,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </Column>
      <Column
        style={{
          fontSize: 14,
          color: colors.deepSlate,
          fontWeight: bold ? 700 : 400,
        }}
      >
        {value}
      </Column>
    </Row>
  );
}
