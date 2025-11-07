provider "google" {
  project = "prefab-conquest-186122"
}

resource "google_compute_global_address" "joeym-org-ip" {
  name = "joeym-org-ip"
}

locals {
  domains = toset([
    "joeym.org",
    "crosswords.joeym.org",
    "combinators.joeym.org",
    "boobtree.com",
    "passthepic.com",
    "quickerpass.joeym.org",
  ])
}

// HTTP to HTTPS redirect
resource "google_compute_global_forwarding_rule" "forwarding-rule" {
  name = "joeym-org-http"

  ip_address = google_compute_global_address.joeym-org-ip.self_link
  ip_protocol = "TCP"
  port_range = "80"

  target = google_compute_target_http_proxy.http-proxy.self_link
}

resource "google_compute_target_http_proxy" "http-proxy" {
  name    = "joeym-org-http"
  url_map = google_compute_url_map.http-redirect-map.id
}

resource "google_compute_url_map" "http-redirect-map" {
  name = "joeym-org-http-redirect"

  default_url_redirect {
    https_redirect = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query = true
  }
}

// HTTPS setup
resource "google_compute_global_forwarding_rule" "forwarding-rule-https" {
  name = "joeym-org-https"
  target = google_compute_target_https_proxy.https-proxy.self_link
  ip_address = google_compute_global_address.joeym-org-ip.self_link
  ip_protocol = "TCP"
  port_range = "443"
}

resource "google_compute_target_https_proxy" "https-proxy" {
  name    = "joeym-org"
  url_map = google_compute_url_map.url-map.id
  ssl_certificates = [for cert in google_compute_managed_ssl_certificate.ssl_cert : cert.self_link]
}

resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  for_each = local.domains
  name = "ssl-cert-${replace(each.value, ".", "-")}"

  managed {
    domains = [each.value]
  }
}

resource "google_compute_url_map" "url-map" {
  name            = "url-map"
  default_service = google_compute_backend_bucket.backend-bucket["joeym.org"].id

  dynamic "host_rule" {
    for_each = local.domains
    content {
      hosts        = [host_rule.value]
      path_matcher = replace(host_rule.value, ".", "-")
    }
  }

  path_matcher {
    name            = "joeym-org"
    default_service = google_compute_backend_bucket.backend-bucket["joeym.org"].id

    path_rule {
      paths = ["/resume"]
      url_redirect {
        host_redirect = "docs.google.com"
        https_redirect = true
        path_redirect = "/document/d/e/2PACX-1vTULD7-CDdmj6nHF3EhLIUp9rq-od86fiPu2KZdYVgoDbdWKVkysvhwF-AqSkGGot-LCXY3tEITFi9R/pub"
        strip_query = true
      }
    }
  }

  dynamic "path_matcher" {
    for_each = [for d in local.domains : d if d != "joeym.org"]
    content {
      name            = replace(path_matcher.value, ".", "-")
      default_service = google_compute_backend_bucket.backend-bucket[path_matcher.value].id
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

// Backends and buckets
resource "google_compute_backend_bucket" "backend-bucket" {
  for_each    = local.domains
  name        = replace(each.value, ".", "-")
  bucket_name = google_storage_bucket.bucket[each.value].name
  enable_cdn  = true
}

resource "google_storage_bucket" "bucket" {
  for_each    = local.domains
  // TODO: Fix this one-off
  name = each.value == "joeym.org" ? "joeym-org-main-website" : replace(each.value, ".", "-")
  location    = "US"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
}
// TODO: Enable public access to all these buckets. I've been doing this manually via the console, but it should be in the code.
