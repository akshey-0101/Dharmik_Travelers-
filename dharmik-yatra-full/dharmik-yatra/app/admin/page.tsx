'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

/* =========================================================
   TYPES
   ========================================================= */

type Booking = {
  id: string
  booking_code: string
  customer_name: string
  phone: string
  passengers: number
  pickup_point: string | null
  amount: number
  advance_paid: number
  payment_status: string
  booking_status: string
  notes: string | null
  created_at: string
  trips?: {
    title: string
  } | null
}

type Trip = {
  id: string
  slug: string
  title: string
  short_description: string | null
  description: string | null

  travel_date: string | null
  start_date: string | null

  departure_time: string | null
  return_time: string | null
  duration: string | null

  price: number
  starting_price: number

  capacity: number
  booked_seats: number

  pickup_points: string[] | null
  places: string[] | null
  destinations: string[] | null

  itinerary: string[] | null

  included: string[] | null
  inclusions: string[] | null

  not_included: string[] | null
  exclusions: string[] | null

  image_url: string | null

  status: string

  created_at: string
  updated_at: string
}

type TripForm = {
  slug: string
  title: string

  short_description: string
  description: string

  travel_date: string
  start_date: string

  departure_time: string
  return_time: string
  duration: string

  price: string
  starting_price: string

  capacity: string
  booked_seats: string

  pickup_points: string
  places: string
  destinations: string

  itinerary: string

  included: string
  inclusions: string

  not_included: string
  exclusions: string

  image_url: string

  status:
    | 'draft'
    | 'published'
    | 'upcoming'
    | 'completed'
    | 'cancelled'
}

/* =========================================================
   EMPTY FORM
   ========================================================= */

const emptyTrip: TripForm = {
  slug: '',
  title: '',

  short_description: '',
  description: '',

  travel_date: '',
  start_date: '',

  departure_time: '',
  return_time: '',
  duration: '',

  price: '',
  starting_price: '',

  capacity: '40',
  booked_seats: '0',

  pickup_points: '',
  places: '',
  destinations: '',

  itinerary: '',

  included: '',
  inclusions: '',

  not_included: '',
  exclusions: '',

  image_url: '',

  status: 'published',
}


/* =========================================================
   ADMIN COMPONENT
   ========================================================= */

export default function Admin() {
  const sb = getSupabaseBrowser()

  const [user, setUser] = useState<any>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [trips, setTrips] = useState<Trip[]>([])

  const [activeTab, setActiveTab] =
    useState<'bookings' | 'trips'>('bookings')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loading, setLoading] = useState(false)
  const [tripLoading, setTripLoading] = useState(false)

  const [showTripForm, setShowTripForm] =
    useState(false)

  const [editingTripId, setEditingTripId] =
    useState<string | null>(null)

  const [tripForm, setTripForm] =
    useState<TripForm>(emptyTrip)


  /* =========================================================
     LOAD DATA
     ========================================================= */

  async function load() {
    if (!sb) return

    setError('')

    const {
      data: { user },
    } = await sb.auth.getUser()

    setUser(user)

    if (!user) return


    /* -------------------------------------------------------
       BOOKINGS
       ------------------------------------------------------- */

    const bookingResult = await sb
      .from('bookings')
      .select('*,trips(title)')
      .order('created_at', {
        ascending: false,
      })
      .limit(100)

    if (bookingResult.error) {
      setError(bookingResult.error.message)
    } else {
      setBookings(
        (bookingResult.data || []) as Booking[]
      )
    }


    /* -------------------------------------------------------
       TRIPS
       ------------------------------------------------------- */

    const tripResult = await sb
      .from('trips')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (tripResult.error) {
      setError(tripResult.error.message)
    } else {
      setTrips(
        (tripResult.data || []) as Trip[]
      )
    }
  }


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    load()
  }, [])


  /* =========================================================
     LOGIN
     ========================================================= */

  async function login(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!sb) return

    setError('')
    setSuccess('')
    setLoading(true)

    const result =
      await sb.auth.signInWithPassword({
        email,
        password,
      })

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    await load()
  }


  /* =========================================================
     LOGOUT
     ========================================================= */

  async function logout() {
    await sb?.auth.signOut()

    setUser(null)
    setBookings([])
    setTrips([])
  }


  /* =========================================================
     SLUG GENERATOR
     ========================================================= */

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }


  /* =========================================================
     ARRAY HELPERS
     ========================================================= */

  function arrayToText(
    value: string[] | null | undefined
  ) {
    if (!Array.isArray(value)) {
      return ''
    }

    return value.join('\n')
  }


  function textToArray(value: string) {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }


  /* =========================================================
     FORM FIELD UPDATE
     ========================================================= */

  function updateTripField(
    field: keyof TripForm,
    value: string
  ) {
    setTripForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }


  /* =========================================================
     ADD TRIP
     ========================================================= */

  function startAddTrip() {
    setEditingTripId(null)

    setTripForm({
      ...emptyTrip,
    })

    setError('')
    setSuccess('')

    setShowTripForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  /* =========================================================
     EDIT TRIP
     ========================================================= */

  function startEditTrip(trip: Trip) {
    setEditingTripId(trip.id)

    setTripForm({
      slug: trip.slug || '',
      title: trip.title || '',

      short_description:
        trip.short_description || '',

      description:
        trip.description || '',

      travel_date:
        trip.travel_date || '',

      start_date:
        trip.start_date || '',

      departure_time:
        trip.departure_time || '',

      return_time:
        trip.return_time || '',

      duration:
        trip.duration || '',

      price:
        String(trip.price ?? 0),

      starting_price:
        String(trip.starting_price ?? 0),

      capacity:
        String(trip.capacity ?? 40),

      booked_seats:
        String(trip.booked_seats ?? 0),

      pickup_points:
        arrayToText(trip.pickup_points),

      places:
        arrayToText(trip.places),

      destinations:
        arrayToText(trip.destinations),

      itinerary:
        arrayToText(trip.itinerary),

      included:
        arrayToText(trip.included),

      inclusions:
        arrayToText(trip.inclusions),

      not_included:
        arrayToText(trip.not_included),

      exclusions:
        arrayToText(trip.exclusions),

      image_url:
        trip.image_url || '',

      status:
        trip.status === 'published' ||
        trip.status === 'upcoming' ||
        trip.status === 'completed' ||
        trip.status === 'cancelled'
          ? trip.status
          : 'draft',
    })

    setError('')
    setSuccess('')

    setShowTripForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  /* =========================================================
     CANCEL
     ========================================================= */

  function cancelTripForm() {
    setShowTripForm(false)

    setEditingTripId(null)

    setTripForm({
      ...emptyTrip,
    })

    setError('')
  }


  /* =========================================================
     SAVE TRIP
     ========================================================= */

  async function saveTrip(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!sb) return

    setError('')
    setSuccess('')
    setTripLoading(true)


    /* -------------------------------------------------------
       BASIC VALIDATION
       ------------------------------------------------------- */

    if (!tripForm.title.trim()) {
      setError(
        'Trip title is required.'
      )

      setTripLoading(false)
      return
    }

    if (!tripForm.slug.trim()) {
      setError(
        'Trip slug is required.'
      )

      setTripLoading(false)
      return
    }


    const price =
      Number(tripForm.price)

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      setError(
        'Please enter a valid price.'
      )

      setTripLoading(false)
      return
    }


    const startingPrice =
      tripForm.starting_price.trim()
        ? Number(
            tripForm.starting_price
          )
        : price

    if (
      Number.isNaN(startingPrice) ||
      startingPrice < 0
    ) {
      setError(
        'Please enter a valid starting price.'
      )

      setTripLoading(false)
      return
    }


    const capacity =
      Number(tripForm.capacity)

    if (
      Number.isNaN(capacity) ||
      capacity < 1
    ) {
      setError(
        'Capacity must be at least 1.'
      )

      setTripLoading(false)
      return
    }


    const bookedSeats =
      Number(tripForm.booked_seats)

    if (
      Number.isNaN(bookedSeats) ||
      bookedSeats < 0
    ) {
      setError(
        'Booked seats cannot be negative.'
      )

      setTripLoading(false)
      return
    }


    if (bookedSeats > capacity) {
      setError(
        'Booked seats cannot be greater than capacity.'
      )

      setTripLoading(false)
      return
    }


    /* -------------------------------------------------------
       PAYLOAD
       ------------------------------------------------------- */

    const pickupPoints =
      textToArray(
        tripForm.pickup_points
      )

    const places =
      textToArray(
        tripForm.places
      )

    const destinations =
      textToArray(
        tripForm.destinations
      )

    const itinerary =
      textToArray(
        tripForm.itinerary
      )

    const included =
      textToArray(
        tripForm.included
      )

    const inclusions =
      textToArray(
        tripForm.inclusions
      )

    const notIncluded =
      textToArray(
        tripForm.not_included
      )

    const exclusions =
      textToArray(
        tripForm.exclusions
      )


    /* -------------------------------------------------------
       KEEP SIMPLE + EXTENDED FIELDS SYNCHRONIZED
       ------------------------------------------------------- */

    const payload = {
      slug:
        tripForm.slug.trim(),

      title:
        tripForm.title.trim(),

      short_description:
        tripForm.short_description.trim() ||
        null,

      description:
        tripForm.description.trim() ||
        null,

      travel_date:
        tripForm.travel_date.trim() ||
        null,

      start_date:
        tripForm.start_date.trim() ||
        null,

      departure_time:
        tripForm.departure_time.trim() ||
        null,

      return_time:
        tripForm.return_time.trim() ||
        null,

      duration:
        tripForm.duration.trim() ||
        null,

      price,

      starting_price:
        startingPrice,

      capacity,

      booked_seats:
        bookedSeats,

      pickup_points:
        pickupPoints,

      places,

      destinations,

      itinerary,

      included,

      inclusions:
        inclusions.length
          ? inclusions
          : included,

      not_included:
        notIncluded,

      exclusions:
        exclusions.length
          ? exclusions
          : notIncluded,

      image_url:
        tripForm.image_url.trim() ||
        null,

      status:
        tripForm.status,
    }


    /* -------------------------------------------------------
       INSERT / UPDATE
       ------------------------------------------------------- */

    let result

    if (editingTripId) {
      result = await sb
        .from('trips')
        .update(payload)
        .eq(
          'id',
          editingTripId
        )
    } else {
      result = await sb
        .from('trips')
        .insert(payload)
    }


    setTripLoading(false)


    /* -------------------------------------------------------
       ERROR
       ------------------------------------------------------- */

    if (result.error) {
      setError(
        result.error.message
      )

      return
    }


    /* -------------------------------------------------------
       SUCCESS
       ------------------------------------------------------- */

    setSuccess(
      editingTripId
        ? 'Trip updated successfully.'
        : 'Trip created successfully.'
    )

    setShowTripForm(false)

    setEditingTripId(null)

    setTripForm({
      ...emptyTrip,
    })

    await load()
  }


  /* =========================================================
     DELETE TRIP
     ========================================================= */

  async function deleteTrip(
    trip: Trip
  ) {
    if (!sb) return

    const confirmed =
      window.confirm(
        `Delete "${trip.title}"?\n\nThis cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    const result =
      await sb
        .from('trips')
        .delete()
        .eq('id', trip.id)

    if (result.error) {
      setError(
        result.error.message
      )

      return
    }

    setSuccess(
      'Trip deleted successfully.'
    )

    await load()
  }


  /* =========================================================
     TOGGLE STATUS
     ========================================================= */

  async function toggleTripStatus(
    trip: Trip
  ) {
    if (!sb) return

    const newStatus =
      trip.status === 'published'
        ? 'draft'
        : 'published'

    setError('')
    setSuccess('')

    const result =
      await sb
        .from('trips')
        .update({
          status: newStatus,
        })
        .eq('id', trip.id)

    if (result.error) {
      setError(
        result.error.message
      )

      return
    }

    setSuccess(
      newStatus === 'published'
        ? 'Trip published.'
        : 'Trip moved to draft.'
    )

    await load()
  }


  /* =========================================================
     SUPABASE NOT CONFIGURED
     ========================================================= */

  if (!sb) {
    return (
      <main>
        <div className="container pagePad">
          <h1 className="pageTitle">
            Admin setup required
          </h1>

          <p className="lead">
            Add Supabase environment
            variables first.
          </p>
        </div>
      </main>
    )
  }


  /* =========================================================
     LOGIN SCREEN
     ========================================================= */

  if (!user) {
    return (
      <main>
        <div className="container pagePad">

          <Link href="/">
            ← Home
          </Link>

          <div className="form narrow">

            <div className="eyebrow">
              Private dashboard
            </div>

            <h1 className="pageTitle small">
              Admin Login
            </h1>

            <form
              onSubmit={login}
            >

              <div className="field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="field">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />

              </div>


              {error && (
                <div className="error">
                  {error}
                </div>
              )}


              <button
                className="btn primary fullBtn"
                disabled={loading}
              >
                {loading
                  ? 'Signing in...'
                  : 'Sign in'}
              </button>

            </form>

          </div>

        </div>
      </main>
    )
  }


  /* =========================================================
     DASHBOARD
     ========================================================= */

  const totalPassengers =
    bookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.passengers || 0
        ),
      0
    )


  const totalBookingValue =
    bookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.amount || 0
        ),
      0
    )


  const publishedTrips =
    trips.filter(
      (trip) =>
        trip.status === 'published'
    ).length


  /* =========================================================
     ADMIN UI
     ========================================================= */

  return (
    <main>

      <div className="container pagePad">


        {/* ===================================================
            HEADER
           =================================================== */}

        <div className="adminTop">

          <div>

            <div className="eyebrow">
              Dharmik Yatra
            </div>

            <h1 className="pageTitle small">
              Admin Dashboard
            </h1>

          </div>


          <button
            className="btn secondary"
            onClick={logout}
          >
            Logout
          </button>

        </div>


        {/* ===================================================
            TABS
           =================================================== */}

        <div className="adminTabs">

          <button
            className={
              activeTab === 'bookings'
                ? 'btn primary'
                : 'btn secondary'
            }
            onClick={() => {
              setActiveTab(
                'bookings'
              )

              setError('')
              setSuccess('')
            }}
          >
            Bookings
          </button>


          <button
            className={
              activeTab === 'trips'
                ? 'btn primary'
                : 'btn secondary'
            }
            onClick={() => {
              setActiveTab(
                'trips'
              )

              setError('')
              setSuccess('')
            }}
          >
            Trips
          </button>

        </div>


        {/* ===================================================
            MESSAGES
           =================================================== */}

        {error && (
          <div className="error adminMessage">
            {error}
          </div>
        )}


        {success && (
          <div className="success adminMessage">
            {success}
          </div>
        )}


        {/* ===================================================
            BOOKINGS
           =================================================== */}

        {activeTab === 'bookings' && (
          <>

            <div className="stats">


              <div>
                <span>
                  Bookings
                </span>

                <strong>
                  {bookings.length}
                </strong>
              </div>


              <div>
                <span>
                  Passengers
                </span>

                <strong>
                  {totalPassengers}
                </strong>
              </div>


              <div>
                <span>
                  Booking Value
                </span>

                <strong>
                  ₹
                  {totalBookingValue.toLocaleString(
                    'en-IN'
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Published Trips
                </span>

                <strong>
                  {publishedTrips}
                </strong>
              </div>

            </div>


            <div className="tableWrap">

              <table className="adminTable">

                <thead>

                  <tr>

                    <th>
                      Booking
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Trip
                    </th>

                    <th>
                      People
                    </th>

                    <th>
                      Pickup
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {bookings.length === 0 && (
                    <tr>

                      <td
                        colSpan={8}
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '40px',
                        }}
                      >
                        No bookings yet.
                      </td>

                    </tr>
                  )}


                  {bookings.map(
                    (booking) => (
                      <tr
                        key={
                          booking.id
                        }
                      >

                        <td>

                          <strong>
                            {
                              booking.booking_code
                            }
                          </strong>

                          <br />

                          <small>
                            {new Date(
                              booking.created_at
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </small>

                        </td>


                        <td>

                          {
                            booking.customer_name
                          }

                          <br />

                          {
                            booking.phone
                          }

                        </td>


                        <td>

                          {
                            booking
                              .trips
                              ?.title ||
                            '—'
                          }

                        </td>


                        <td>
                          {
                            booking.passengers
                          }
                        </td>


                        <td>
                          {
                            booking.pickup_point ||
                            '—'
                          }
                        </td>


                        <td>
                          ₹
                          {Number(
                            booking.amount ||
                              0
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </td>


                        <td>
                          <span className="pill">
                            {
                              booking.payment_status
                            }
                          </span>
                        </td>


                        <td>
                          <span className="pill">
                            {
                              booking.booking_status
                            }
                          </span>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </>
        )}


        {/* ===================================================
            TRIPS
           =================================================== */}

        {activeTab === 'trips' && (
          <>

            <div className="adminSectionHeader">

              <div>

                <h2>
                  Trips
                </h2>

                <p>
                  Create, edit, publish
                  and manage all
                  Dharmik Yatra trips.
                </p>

              </div>


              <button
                className="btn primary"
                onClick={
                  startAddTrip
                }
              >
                + Add Trip
              </button>

            </div>


            {/* =================================================
                TRIP EDITOR
               ================================================= */}

            {showTripForm && (
              <div className="adminEditor">

                <div className="adminEditorHeader">

                  <div>

                    <div className="eyebrow">
                      {editingTripId
                        ? 'Edit Trip'
                        : 'New Trip'}
                    </div>

                    <h2>
                      {editingTripId
                        ? 'Update Yatra'
                        : 'Create Yatra'}
                    </h2>

                  </div>


                  <button
                    type="button"
                    className="btn secondary"
                    onClick={
                      cancelTripForm
                    }
                  >
                    Cancel
                  </button>

                </div>


                <form
                  className="form adminTripForm"
                  onSubmit={
                    saveTrip
                  }
                >


                  {/* =========================================
                      BASIC INFORMATION
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      Basic Information
                    </h3>

                    <div className="formGrid">


                      <div className="field full">

                        <label>
                          Trip Title *
                        </label>

                        <input
                          type="text"
                          required
                          placeholder="Golu Devta • Kainchi Dham • Mukteshwar"
                          value={
                            tripForm.title
                          }
                          onChange={(e) => {

                            const title =
                              e.target
                                .value

                            setTripForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                title,

                                slug:
                                  editingTripId
                                    ? previous.slug
                                    : makeSlug(
                                        title
                                      ),
                              })
                            )
                          }}
                        />

                      </div>


                      <div className="field">

                        <label>
                          Slug *
                        </label>

                        <input
                          type="text"
                          required
                          placeholder="golu-kainchi-mukteshwar"
                          value={
                            tripForm.slug
                          }
                          onChange={(e) =>
                            updateTripField(
                              'slug',
                              e.target
                                .value
                            )
                          }
                        />

                        <small>
                          Used in the
                          trip URL.
                        </small>

                      </div>


                      <div className="field">

                        <label>
                          Main Image URL
                        </label>

                        <input
                          type="url"
                          placeholder="https://..."
                          value={
                            tripForm.image_url
                          }
                          onChange={(e) =>
                            updateTripField(
                              'image_url',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field full">

                        <label>
                          Short Description
                        </label>

                        <input
                          type="text"
                          placeholder="One day spiritual journey covering three sacred destinations."
                          value={
                            tripForm.short_description
                          }
                          onChange={(e) =>
                            updateTripField(
                              'short_description',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field full">

                        <label>
                          Full Description
                        </label>

                        <textarea
                          placeholder="Describe the complete yatra..."
                          value={
                            tripForm.description
                          }
                          onChange={(e) =>
                            updateTripField(
                              'description',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>


                  {/* =========================================
                      DATE & TIME
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      Date & Timing
                    </h3>

                    <div className="formGrid">


                      <div className="field">

                        <label>
                          Travel Date
                        </label>

                        <input
                          type="date"
                          value={
                            tripForm.travel_date
                          }
                          onChange={(e) =>
                            updateTripField(
                              'travel_date',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Start Date
                        </label>

                        <input
                          type="date"
                          value={
                            tripForm.start_date
                          }
                          onChange={(e) =>
                            updateTripField(
                              'start_date',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Departure Time
                        </label>

                        <input
                          type="text"
                          placeholder="9:00 PM"
                          value={
                            tripForm.departure_time
                          }
                          onChange={(e) =>
                            updateTripField(
                              'departure_time',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Return Time
                        </label>

                        <input
                          type="text"
                          placeholder="9:00 PM next day"
                          value={
                            tripForm.return_time
                          }
                          onChange={(e) =>
                            updateTripField(
                              'return_time',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Duration
                        </label>

                        <input
                          type="text"
                          placeholder="1 Day / 1 Night"
                          value={
                            tripForm.duration
                          }
                          onChange={(e) =>
                            updateTripField(
                              'duration',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>


                  {/* =========================================
                      PRICING & SEATS
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      Pricing & Seats
                    </h3>

                    <div className="formGrid">


                      <div className="field">

                        <label>
                          Price Per Person *
                        </label>

                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="1850"
                          value={
                            tripForm.price
                          }
                          onChange={(e) =>
                            updateTripField(
                              'price',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Starting Price
                        </label>

                        <input
                          type="number"
                          min="0"
                          placeholder="1850"
                          value={
                            tripForm.starting_price
                          }
                          onChange={(e) =>
                            updateTripField(
                              'starting_price',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Bus Capacity *
                        </label>

                        <input
                          type="number"
                          min="1"
                          required
                          value={
                            tripForm.capacity
                          }
                          onChange={(e) =>
                            updateTripField(
                              'capacity',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Booked Seats
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            tripForm.booked_seats
                          }
                          onChange={(e) =>
                            updateTripField(
                              'booked_seats',
                              e.target
                                .value
                            )
                          }
                        />

                        <small>
                          Current seats
                          already
                          booked.
                        </small>

                      </div>

                    </div>

                  </div>


                  {/* =========================================
                      LOCATIONS
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      Locations
                    </h3>

                    <div className="formGrid">


                      <div className="field full">

                        <label>
                          Pickup Points
                        </label>

                        <textarea
                          placeholder={
                            'One pickup point per line\nShahdara\nAnand Vihar\nKarkardooma'
                          }
                          value={
                            tripForm.pickup_points
                          }
                          onChange={(e) =>
                            updateTripField(
                              'pickup_points',
                              e.target
                                .value
                            )
                          }
                        />

                        <small>
                          One pickup
                          point per
                          line.
                        </small>

                      </div>


                      <div className="field">

                        <label>
                          Places
                        </label>

                        <textarea
                          placeholder={
                            'Golu Devta\nKainchi Dham\nMukteshwar'
                          }
                          value={
                            tripForm.places
                          }
                          onChange={(e) =>
                            updateTripField(
                              'places',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Destinations
                        </label>

                        <textarea
                          placeholder={
                            'Golu Devta\nKainchi Dham\nMukteshwar'
                          }
                          value={
                            tripForm.destinations
                          }
                          onChange={(e) =>
                            updateTripField(
                              'destinations',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>


                  {/* =========================================
                      ITINERARY
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      Itinerary
                    </h3>

                    <div className="field">

                      <label>
                        Day / Time Schedule
                      </label>

                      <textarea
                        className="largeTextarea"
                        placeholder={
                          '9:00 PM - Departure from Shahdara\n6:00 AM - Golu Devta\n9:30 AM - Kainchi Dham\n1:00 PM - Lunch / Break\n3:00 PM - Mukteshwar\n9:00 PM - Return journey'
                        }
                        value={
                          tripForm.itinerary
                        }
                        onChange={(e) =>
                          updateTripField(
                            'itinerary',
                            e.target
                              .value
                          )
                        }
                      />

                      <small>
                        One itinerary
                        item per line.
                      </small>

                    </div>

                  </div>


                  {/* =========================================
                      INCLUDED / EXCLUDED
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      What's Included
                      & Excluded
                    </h3>

                    <div className="formGrid">


                      <div className="field">

                        <label>
                          Included
                        </label>

                        <textarea
                          placeholder={
                            'Round-trip transportation\nTea\nBreakfast\nTour coordinator'
                          }
                          value={
                            tripForm.included
                          }
                          onChange={(e) =>
                            updateTripField(
                              'included',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Inclusions
                        </label>

                        <textarea
                          placeholder={
                            'Transportation\nTea / breakfast\nCoordinator'
                          }
                          value={
                            tripForm.inclusions
                          }
                          onChange={(e) =>
                            updateTripField(
                              'inclusions',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Not Included
                        </label>

                        <textarea
                          placeholder={
                            'Personal expenses\nSpecial darshan charges\nAnything not listed'
                          }
                          value={
                            tripForm.not_included
                          }
                          onChange={(e) =>
                            updateTripField(
                              'not_included',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>


                      <div className="field">

                        <label>
                          Exclusions
                        </label>

                        <textarea
                          placeholder={
                            'Personal expenses\nOptional paid services'
                          }
                          value={
                            tripForm.exclusions
                          }
                          onChange={(e) =>
                            updateTripField(
                              'exclusions',
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>


                  {/* =========================================
                      STATUS
                     ========================================= */}

                  <div className="adminFormSection">

                    <h3>
                      Publishing
                    </h3>

                    <div className="field">

                      <label>
                        Trip Status
                      </label>

                      <select
                        value={
                          tripForm.status
                        }
                        onChange={(e) =>
                          updateTripField(
                            'status',
                            e.target
                              .value
                          )
                        }
                      >

                        <option value="published">
                          Published — visible
                        </option>

                        <option value="draft">
                          Draft — hidden
                        </option>

                        <option value="upcoming">
                          Upcoming
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>

                      </select>

                    </div>

                  </div>


                  {/* =========================================
                      SAVE
                     ========================================= */}

                  <div className="adminEditorActions">

                    <button
                      type="submit"
                      className="btn primary"
                      disabled={
                        tripLoading
                      }
                    >
                      {tripLoading
                        ? 'Saving...'
                        : editingTripId
                          ? 'Save Changes'
                          : 'Create Trip'}
                    </button>


                    <button
                      type="button"
                      className="btn secondary"
                      onClick={
                        cancelTripForm
                      }
                      disabled={
                        tripLoading
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </form>

              </div>
            )}


            {/* =================================================
                TRIPS TABLE
               ================================================= */}

            <div className="tableWrap">

              <table className="adminTable">

                <thead>

                  <tr>

                    <th>
                      Trip
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Seats
                    </th>

                    <th>
                      Places
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {trips.length === 0 && (
                    <tr>

                      <td
                        colSpan={7}
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '40px',
                        }}
                      >
                        No trips found.
                      </td>

                    </tr>
                  )}


                  {trips.map(
                    (trip) => {

                      const seatsLeft =
                        Math.max(
                          0,
                          Number(
                            trip.capacity
                          ) -
                            Number(
                              trip.booked_seats ||
                                0
                            )
                        )

                      return (
                        <tr
                          key={
                            trip.id
                          }
                        >

                          <td>

                            <strong>
                              {
                                trip.title
                              }
                            </strong>

                            <br />

                            <small>
                              /{trip.slug}
                            </small>

                          </td>


                          <td>

                            {trip.travel_date
                              ? new Date(
                                  trip.travel_date +
                                    'T00:00:00'
                                ).toLocaleDateString(
                                  'en-IN',
                                  {
                                    day:
                                      'numeric',
                                    month:
                                      'short',
                                    year:
                                      'numeric',
                                  }
                                )
                              : '—'}

                          </td>


                          <td>

                            ₹
                            {Number(
                              trip.price ||
                                0
                            ).toLocaleString(
                              'en-IN'
                            )}

                          </td>


                          <td>

                            <strong>
                              {
                                trip.booked_seats
                              }
                              /
                              {
                                trip.capacity
                              }
                            </strong>

                            <br />

                            <small>
                              {
                                seatsLeft
                              }{' '}
                              left
                            </small>

                          </td>


                          <td>
                            {
                              trip.places
                                ?.length ||
                              0
                            }
                          </td>


                          <td>

                            <span
                              className={
                                trip.status ===
                                'published'
                                  ? 'pill'
                                  : 'pill unpublished'
                              }
                            >
                              {
                                trip.status
                              }
                            </span>

                          </td>


                          <td>

                            <div className="adminActions">

                              <button
                                className="btn secondary"
                                onClick={() =>
                                  startEditTrip(
                                    trip
                                  )
                                }
                              >
                                Edit
                              </button>


                              <button
                                className="btn secondary"
                                onClick={() =>
                                  toggleTripStatus(
                                    trip
                                  )
                                }
                              >
                                {trip.status ===
                                'published'
                                  ? 'Unpublish'
                                  : 'Publish'}
                              </button>


                              <button
                                className="btn dangerBtn"
                                onClick={() =>
                                  deleteTrip(
                                    trip
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    }
                  )}

                </tbody>

              </table>

            </div>

          </>
        )}

      </div>

    </main>
  )
}
