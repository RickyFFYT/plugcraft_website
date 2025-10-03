import Image, { ImageProps } from 'next/image'

// A small wrapper around next/image that ensures any fetchPriority prop
// is applied to the underlying <img> element as a lowercase attribute
// (fetchpriority) to avoid React dev warnings when fetchPriority would
// otherwise be forwarded as a camelCase attribute.

export default function SafeImage(props: ImageProps) {
  // next/image types include fetchPriority in recent versions; accept generic any to be defensive
  const p: any = props
  const fp = p.fetchPriority
  const incomingImgProps = p.imgProps || {}

  // clone imgProps and ensure lowercase fetchpriority attribute is set
  const safeImgProps: Record<string, any> = { ...incomingImgProps }
  if (fp !== undefined) {
    safeImgProps.fetchpriority = fp
  }

  // Build props to pass to next/image without the camelCase fetchPriority
  const { fetchPriority, imgProps, ...nextProps } = p

  return <Image {...nextProps} imgProps={safeImgProps} />
}
