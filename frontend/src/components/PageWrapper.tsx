import React from "react"
import Head from "next/head"

interface PageWrapperProps {
  title?: string
  children?: React.ReactNode
}

export const PageWrapper: React.FC<PageWrapperProps> = React.memo(
  ({ title, children }) => {
    return (
      <>
        {title ? (
          <Head>
            <title>{title}</title>
          </Head>
        ) : null}
        {children}
      </>
    )
  },
)
