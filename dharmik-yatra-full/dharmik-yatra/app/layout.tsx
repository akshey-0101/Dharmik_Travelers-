import './globals.css';
import {site} from '@/lib/data';
import type {Metadata} from 'next';
export const metadata:Metadata={title:`${site.name} | Dharmik Yatra from Delhi`,description:'Fixed-date religious group yatras from Delhi with transport, darshan and trip coordination.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="hi"><body>{children}</body></html>}
