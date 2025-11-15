import Image, { ImageProps } from 'next/image'

// A small wrapper around next/image that normalizes fetchPriority handing to
// the Image component. Historically we set fetchpriority on the underlying
// <img> element via imgProps, but newer Next versions accept fetchPriority and
// forward it to the underlying <img> element correctly.
export default function SafeImage(props: ImageProps) {
  const { fetchPriority, ...nextProps } = props
  return <Image {...(nextProps as ImageProps)} fetchPriority={fetchPriority} />
}
