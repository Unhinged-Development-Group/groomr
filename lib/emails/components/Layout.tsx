import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Hr,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

export const colors = {
  gold: "#eae45c",
  deepSlate: "#2c3e50",
  sageLeaf: "#88a096",
  pebbleGrey: "#95a5a6",
  alabaster: "#f9f8f4",
  terracotta: "#c87964",
};

interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
  footer?: React.ReactNode;
  appUrl?: string;
}

export function Layout({
  children,
  preview,
  footer,
  appUrl = "https://groomr.uk",
}: LayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.alabaster,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 2px 12px rgba(44,62,80,0.07)",
            }}
          >
            {/* Header band */}
            <Row>
              <Column
                style={{
                  backgroundColor: colors.deepSlate,
                  borderRadius: "20px 20px 0 0",
                  padding: "22px 32px",
                  textAlign: "center",
                }}
              >
                <Img
                  src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753253/Horizontal_Lockup_-_GROOMR_GOLD_kfzzzr.png"
                  alt="groomr"
                  width={180}
                  height={30}
                  style={{ display: "block", margin: "0 auto" }}
                />
              </Column>
            </Row>

            {/* Body */}
            <Row>
              <Column style={{ padding: "32px 32px 36px" }}>
                {children}

                <Hr style={{ border: "none", borderTop: "1px solid #f0eeea", margin: "24px 0" }} />

                {footer ?? (
                  <Text
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: colors.pebbleGrey,
                      textAlign: "center",
                    }}
                  >
                    Powered by{" "}
                    <Link
                      href={appUrl}
                      style={{ color: colors.sageLeaf, textDecoration: "none" }}
                    >
                      Groomr
                    </Link>
                  </Text>
                )}
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
